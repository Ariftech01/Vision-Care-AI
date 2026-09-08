%% SIH26038 - Diabetic Retinopathy Screening Workflow Model
% Simulink-compatible MATLAB script modeling the screening pipeline
% for district-level deployment (100,000+ patients/year)

clear; clc;

%% Configuration
config.acquisition_rate = 30;           % images per hour per camera
config.bandwidth_mbps = 10;             % network bandwidth
config.image_size_mb = 5;               % average image size
config.processing_time_sec = 8;         % AI processing time per image
config.review_capacity_per_day = 50;    % ophthalmologist reviews per day
config.patient_volume_per_year = 100000;
config.work_hours_per_day = 8;
config.work_days_per_year = 250;
config.cameras_per_center = 4;
config.centers = 12;

%% Derived Metrics
images_per_year = config.patient_volume_per_year;
seconds_per_year = config.work_days_per_year * config.work_hours_per_day * 3600;

% Throughput
total_acquisition_rate = config.acquisition_rate * config.cameras_per_center * config.centers;
images_per_day = total_acquisition_rate * config.work_hours_per_day;
processing_capacity_per_day = (config.work_hours_per_day * 3600) / config.processing_time_sec * config.centers;

% Network transfer time
transfer_time_per_image_sec = (config.image_size_mb * 8) / config.bandwidth_mbps;

% Queue analysis
arrival_rate = images_per_day / (config.work_hours_per_day * 3600);  % per second
service_rate = 1 / config.processing_time_sec;
utilization = arrival_rate / service_rate;

% M/M/1 queue approximation for wait time
if utilization < 1
    avg_wait_time_sec = utilization / (service_rate - arrival_rate);
else
    avg_wait_time_sec = Inf;
end

% Ophthalmologist bottleneck
review_bottleneck = images_per_day / config.review_capacity_per_day;

%% Display Results
fprintf('=== SIH26038 Screening Workflow Analysis ===\n\n');
fprintf('Patient Volume:        %d/year\n', config.patient_volume_per_year);
fprintf('Screening Centers:     %d\n', config.centers);
fprintf('Cameras per Center:    %d\n', config.cameras_per_center);
fprintf('Total Acquisition:     %d images/day\n', images_per_day);
fprintf('AI Processing Cap:     %d images/day\n', floor(processing_capacity_per_day));
fprintf('Network Transfer:      %.2f sec/image\n', transfer_time_per_image_sec);
fprintf('System Utilization:    %.2f%%\n', utilization * 100);
fprintf('Avg Queue Wait:        %.2f seconds\n', avg_wait_time_sec);
fprintf('Review Bottleneck:     %.2fx capacity needed\n', review_bottleneck);

%% Plots
figure('Position', [100 100 1200 400]);

subplot(1,3,1);
bar([images_per_day, processing_capacity_per_day, config.review_capacity_per_day]);
set(gca, 'XTickLabel', {'Acquisition', 'AI Processing', 'Ophthalmologist Review'});
ylabel('Images/Day');
title('Daily Throughput by Stage');
grid on;

subplot(1,3,2);
stages = {'Capture', 'Transfer', 'Quality Gate', 'AI Process', 'Report', 'Review'};
times = [60/config.acquisition_rate, transfer_time_per_image_sec, 2, ...
         config.processing_time_sec, 1, 15];
barh(times);
set(gca, 'YTickLabel', stages);
xlabel('Seconds');
title('Time per Image by Stage');
grid on;

subplot(1,3,3);
months = 1:12;
monthly_volume = config.patient_volume_per_year / 12 * ones(1,12);
plot(months, monthly_volume, 'b-o', 'LineWidth', 2);
hold on;
yline(config.review_capacity_per_day * config.work_days_per_year / 12, 'r--', 'Review Capacity');
xlabel('Month');
ylabel('Patients');
title('Monthly Volume vs Capacity');
grid on;
legend('Patient Volume', 'Review Capacity');

sgtitle('SIH26038 District-Level DR Screening Workflow');

%% Save
saveas(gcf, 'screening_workflow_analysis.png');
fprintf('\nPlot saved to screening_workflow_analysis.png\n');
