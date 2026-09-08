"""Dataset adapters and loaders for APTOS 2019 and generic fundus datasets."""
import os
import pandas as pd
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset
import torchvision.transforms as T
from sklearn.model_selection import train_test_split
from typing import Optional, List, Tuple, Dict, Union

try:
    import albumentations as A
    from albumentations.pytorch import ToTensorV2
    HAS_ALBUMENTATIONS = True
except ImportError:
    HAS_ALBUMENTATIONS = False


def resolve_image_path(image_dir: str, filename_or_code: str) -> Optional[str]:
    """Resolve full image path handling extensions."""
    candidate = os.path.join(image_dir, str(filename_or_code))
    if os.path.exists(candidate) and os.path.isfile(candidate):
        return candidate

    for ext in [".png", ".jpg", ".jpeg"]:
        cand_ext = candidate + ext
        if os.path.exists(cand_ext) and os.path.isfile(cand_ext):
            return cand_ext

    return None


class FundusDataset(Dataset):
    """Generic and APTOS-compatible fundus dataset for DR grading."""

    def __init__(self, image_dir: str, csv_path: Optional[str] = None,
                 dataframe: Optional[pd.DataFrame] = None,
                 samples: Optional[List[Tuple[str, int]]] = None,
                 labels_dict: Optional[Dict[str, int]] = None,
                 transform=None, target_size=(512, 512),
                 validate_files: bool = False):
        self.image_dir = image_dir
        self.transform = transform
        self.target_size = target_size
        self.samples: List[Tuple[str, int]] = []

        if samples is not None:
            self.samples = samples
        elif dataframe is not None:
            self._load_from_df(dataframe, image_dir)
        elif csv_path is not None:
            df = pd.read_csv(csv_path)
            self._load_from_df(df, image_dir)
        elif labels_dict is not None:
            for k, v in labels_dict.items():
                resolved = resolve_image_path(image_dir, k)
                if resolved:
                    self.samples.append((resolved, int(v)))
        else:
            if os.path.exists(image_dir):
                files = [f for f in os.listdir(image_dir)
                         if f.lower().endswith((".png", ".jpg", ".jpeg"))]
                self.samples = [(os.path.join(image_dir, f), -1) for f in files]

        if validate_files:
            self.samples = self._filter_valid_samples(self.samples)

    def _load_from_df(self, df: pd.DataFrame, image_dir: str):
        """Parse dataframe supporting id_code/diagnosis or image/grade."""
        img_col = "id_code" if "id_code" in df.columns else ("image" if "image" in df.columns else df.columns[0])
        label_col = "diagnosis" if "diagnosis" in df.columns else ("grade" if "grade" in df.columns else (df.columns[1] if len(df.columns) > 1 else None))

        for _, row in df.iterrows():
            img_ref = str(row[img_col])
            label = int(row[label_col]) if (label_col and pd.notna(row[label_col])) else -1
            resolved = resolve_image_path(image_dir, img_ref)
            if resolved:
                self.samples.append((resolved, label))

    def _filter_valid_samples(self, samples: List[Tuple[str, int]]) -> List[Tuple[str, int]]:
        valid = []
        for path, label in samples:
            try:
                with Image.open(path) as img:
                    img.verify()
                valid.append((path, label))
            except Exception:
                continue
        return valid

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        image = np.array(Image.open(path).convert("RGB"))

        if self.transform:
            if HAS_ALBUMENTATIONS and isinstance(self.transform, A.Compose):
                augmented = self.transform(image=image)
                image = augmented["image"]
            else:
                pil_img = Image.fromarray(image)
                image = self.transform(pil_img)
        else:
            image = T.ToTensor()(image)

        return {"image": image, "label": label, "path": path}


def verify_dataset_files(image_dir: str, csv_path: str) -> Dict:
    """Validate missing and corrupt images in dataset."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV path not found: {csv_path}")

    df = pd.read_csv(csv_path)
    img_col = "id_code" if "id_code" in df.columns else ("image" if "image" in df.columns else df.columns[0])
    label_col = "diagnosis" if "diagnosis" in df.columns else ("grade" if "grade" in df.columns else (df.columns[1] if len(df.columns) > 1 else None))

    total_records = len(df)
    missing_count = 0
    corrupt_count = 0
    valid_samples = []
    class_counts = {}

    for _, row in df.iterrows():
        img_ref = str(row[img_col])
        label = int(row[label_col]) if (label_col and pd.notna(row[label_col])) else -1
        resolved = resolve_image_path(image_dir, img_ref)
        if not resolved:
            missing_count += 1
            continue
        if os.path.exists(resolved) and os.path.getsize(resolved) > 0:
            valid_samples.append((resolved, label))
            class_counts[label] = class_counts.get(label, 0) + 1
        else:
            corrupt_count += 1

    return {
        "total_records": total_records,
        "valid_count": len(valid_samples),
        "missing_count": missing_count,
        "corrupt_count": corrupt_count,
        "class_distribution": class_counts,
        "valid_samples": valid_samples,
    }


def get_stratified_splits(csv_path: str, image_dir: str, val_split: float = 0.15,
                          test_split: float = 0.15, seed: int = 42) -> Tuple[List[Tuple[str, int]], List[Tuple[str, int]], List[Tuple[str, int]]]:
    """Create stratified train, val, and test sample lists from labeled CSV."""
    verification = verify_dataset_files(image_dir, csv_path)
    valid_samples = verification["valid_samples"]
    if not valid_samples:
        raise ValueError("No valid samples found in dataset.")

    paths = [s[0] for s in valid_samples]
    labels = [s[1] for s in valid_samples]

    temp_split = val_split + test_split
    if temp_split <= 0:
        return valid_samples, [], []

    train_paths, temp_paths, train_labels, temp_labels = train_test_split(
        paths, labels, test_size=temp_split, stratify=labels, random_state=seed
    )

    if test_split <= 0:
        val_samples = list(zip(temp_paths, temp_labels))
        train_samples = list(zip(train_paths, train_labels))
        return train_samples, val_samples, []

    val_prop = val_split / temp_split
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        temp_paths, temp_labels, test_size=(1.0 - val_prop), stratify=temp_labels, random_state=seed
    )

    train_samples = list(zip(train_paths, train_labels))
    val_samples = list(zip(val_paths, val_labels))
    test_samples = list(zip(test_paths, test_labels))

    return train_samples, val_samples, test_samples


def get_train_transforms(config):
    if HAS_ALBUMENTATIONS:
        aug = config["training"]["augmentation"]
        return A.Compose([
            A.Resize(*config["image"]["input_size"]),
            A.HorizontalFlip(p=aug.get("horizontal_flip", 0.5)),
            A.VerticalFlip(p=aug.get("vertical_flip", 0.3)),
            A.Rotate(limit=aug.get("rotation", 15), p=0.5),
            A.RandomBrightnessContrast(p=0.3),
            A.GaussNoise(var_limit=(10, 50), p=0.2),
            A.Normalize(mean=config["image"]["mean"], std=config["image"]["std"]),
            ToTensorV2(),
        ])
    else:
        return T.Compose([
            T.Resize(config["image"]["input_size"]),
            T.RandomHorizontalFlip(p=0.5),
            T.RandomVerticalFlip(p=0.3),
            T.ToTensor(),
            T.Normalize(mean=config["image"]["mean"], std=config["image"]["std"]),
        ])


def get_val_transforms(config):
    if HAS_ALBUMENTATIONS:
        return A.Compose([
            A.Resize(*config["image"]["input_size"]),
            A.Normalize(mean=config["image"]["mean"], std=config["image"]["std"]),
            ToTensorV2(),
        ])
    else:
        return T.Compose([
            T.Resize(config["image"]["input_size"]),
            T.ToTensor(),
            T.Normalize(mean=config["image"]["mean"], std=config["image"]["std"]),
        ])
