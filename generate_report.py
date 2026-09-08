#!/usr/bin/env python3
"""Generate report from saved pipeline results."""
import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import json
from src.reporting.report_generator import ReportGenerator
from src.utils.common import load_config


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--results", required=True, help="JSON results from pipeline")
    parser.add_argument("--config", default="configs/default.yaml")
    parser.add_argument("--output-dir", default="./outputs")
    parser.add_argument("--case-id", default="case")
    args = parser.parse_args()

    config = load_config(args.config)
    generator = ReportGenerator(config)

    with open(args.results) as f:
        results = json.load(f)

    path = generator.generate(args.case_id, results, args.output_dir)
    print(f"Report generated: {path}")


if __name__ == "__main__":
    main()
