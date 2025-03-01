use image::{DynamicImage, GenericImageView};
use std::collections::HashMap;
use crate::models::ImageComplexity;

pub fn calculate_optimal_quality(img: &DynamicImage) -> u8 {
    // 获取图像尺寸和像素数量
    let (width, height) = img.dimensions();
    let pixel_count = width * height;
    
    // 分析图像复杂度
    let complexity = calculate_image_complexity(img);
    
    // 根据图像尺寸和复杂度动态调整质量
    let base_quality = if pixel_count > 2_000_000 {
        // 大图像可以使用较低质量
        75
    } else if pixel_count < 500_000 {
        // 小图像需要较高质量
        90
    } else {
        // 中等尺寸图像
        82
    };
    
    // 根据复杂度调整基础质量
    let adjusted_quality = match complexity {
        ImageComplexity::High => base_quality + 8,    // 复杂图像需要更高质量
        ImageComplexity::Medium => base_quality + 3,  // 中等复杂度
        ImageComplexity::Low => base_quality - 5,     // 简单图像可以用更低质量
    };
    
    // 确保质量在合理范围内
    adjusted_quality.clamp(65, 95)
}

// 分析图像复杂度
fn calculate_image_complexity(img: &DynamicImage) -> ImageComplexity {
    // 转换为灰度图像用于分析
    let gray_img = img.grayscale();
    
    // 计算边缘密度作为复杂度指标
    let edges = edge_detection(&gray_img);
    
    // 计算颜色多样性
    let color_diversity = calculate_color_diversity(img);
    
    // 综合考虑边缘密度和颜色多样性
    if edges > 0.15 || color_diversity > 0.7 {
        ImageComplexity::High
    } else if edges > 0.08 || color_diversity > 0.4 {
        ImageComplexity::Medium
    } else {
        ImageComplexity::Low
    }
}

// 边缘检测函数
fn edge_detection(gray_img: &DynamicImage) -> f32 {
    // 简化实现：使用简单的梯度差分来检测边缘
    let (width, height) = gray_img.dimensions();
    if width < 3 || height < 3 {
        return 0.0;
    }
    
    // 计算边缘像素数量
    let mut edge_pixels = 0;
    let img_buffer = gray_img.to_luma8();
    
    // 采样图像的子集来提高性能
    let sample_rate = if width * height > 1_000_000 { 5usize } else { 2usize };
    
    for y in (sample_rate..(height as usize)-sample_rate).step_by(sample_rate) {
        for x in (sample_rate..(width as usize)-sample_rate).step_by(sample_rate) {
            let center = img_buffer.get_pixel(x as u32, y as u32).0[0] as i32;
            let left = img_buffer.get_pixel((x-sample_rate) as u32, y as u32).0[0] as i32;
            let right = img_buffer.get_pixel((x+sample_rate) as u32, y as u32).0[0] as i32;
            let top = img_buffer.get_pixel(x as u32, (y-sample_rate) as u32).0[0] as i32;
            let bottom = img_buffer.get_pixel(x as u32, (y+sample_rate) as u32).0[0] as i32;
            
            // 计算梯度
            let dx = (left - right).abs();
            let dy = (top - bottom).abs();
            let gradient = (dx + dy) as f32 / 2.0;
            
            // 使用阈值检测边缘
            if gradient > 20.0 {
                edge_pixels += 1;
            }
        }
    }
    
    // 计算边缘密度(边缘像素占比)
    let sampled_pixels = ((width as usize / sample_rate) * (height as usize / sample_rate)) as f32;
    edge_pixels as f32 / sampled_pixels
}

// 计算图像的颜色多样性
fn calculate_color_diversity(img: &DynamicImage) -> f32 {
    // 使用颜色直方图来评估多样性
    let (width, height) = img.dimensions();
    let rgb_img = img.to_rgb8();
    
    // 采样率和量化级别
    let sample_rate = if width * height > 1_000_000 { 7usize } else { 3usize };
    let quantization = 32; // 将每个颜色通道量化为32个级别
    
    // 用于统计颜色直方图
    let mut color_counts = HashMap::new();
    
    // 采样图像颜色
    for y in (0..height as usize).step_by(sample_rate) {
        for x in (0..width as usize).step_by(sample_rate) {
            let pixel = rgb_img.get_pixel(x as u32, y as u32).0;
            
            // 颜色量化
            let r = (pixel[0] as usize) * quantization / 256;
            let g = (pixel[1] as usize) * quantization / 256;
            let b = (pixel[2] as usize) * quantization / 256;
            
            let color_key = (r, g, b);
            *color_counts.entry(color_key).or_insert(0) += 1;
        }
    }
    
    // 不同颜色的数量
    let unique_colors = color_counts.len();
    let max_colors = quantization * quantization * quantization;
    
    // 归一化的颜色多样性
    (unique_colors as f32 / max_colors as f32).min(1.0)
} 