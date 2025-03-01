use image::{DynamicImage, ImageFormat, GenericImageView, ImageOutputFormat};
use base64::{Engine as _, engine::general_purpose};
use std::io::Cursor;

use crate::models::{ImageOptions, ProcessResult, ImageProcessError};
use crate::image_analysis::calculate_optimal_quality;

// 1. 文件大小限制
const MAX_FILE_SIZE: usize = 50 * 1024 * 1024; // 50MB

// 处理单张图片
pub fn process_single_image(base64_data: String, mut options: ImageOptions) -> Result<ProcessResult, ImageProcessError> {
    // 解码base64数据
    let data = base64_data.split(",").nth(1).unwrap_or(&base64_data);
    let image_data = general_purpose::STANDARD
        .decode(data)
        .map_err(|e| ImageProcessError::DecodeError(format!("Failed to decode base64: {}", e)))?;
    
    // 加载图片
    let img = image::load_from_memory(&image_data)
        .map_err(|e| ImageProcessError::IoError(format!("Failed to load image: {}", e)))?;
    
    // 调整大小（如果需要）
    let mut img = resize_image_if_needed(img, options.max_width, options.max_height);
    
    if options.strip_metadata {
        // 移除元数据
        img = strip_metadata(img);
    }
    
    if options.optimize {
        // 根据图片特征选择最佳压缩参数
        options.quality = calculate_optimal_quality(&img);
    }
    
    // 获取图片尺寸
    let (width, height) = img.dimensions();
    
    // 确定输出格式和质量
    let output_format = match options.format.to_lowercase().as_str() {
        "jpeg" | "jpg" => image::ImageOutputFormat::Jpeg(options.quality),
        "png" => image::ImageOutputFormat::Png,
        "gif" => image::ImageOutputFormat::Gif,
        "webp" => image::ImageOutputFormat::WebP,
        "png-to-webp" => {
            // 检查原始图片格式是否为PNG
            if let Ok(format) = image::guess_format(&image_data) {
                if format == ImageFormat::Png {
                    image::ImageOutputFormat::WebP
                } else {
                    return Err(ImageProcessError::InvalidFormat("只能将PNG格式的图片转换为WebP格式".to_string()));
                }
            } else {
                return Err(ImageProcessError::InvalidFormat("无法识别图片格式".to_string()));
            }
        },
        _ => image::ImageOutputFormat::Jpeg(options.quality),
    };
    
    // 编码图片
    let mut buffer = Vec::new();
    img.write_to(&mut Cursor::new(&mut buffer), output_format)
        .map_err(|e| ImageProcessError::EncodeError(format!("Failed to encode image: {}", e)))?;
    
    // 转换为base64
    let base64_data = format!(
        "data:image/{};base64,{}",
        format_to_mime(&options.format),
        general_purpose::STANDARD.encode(&buffer)
    );
    
    // 确保在PNG转WebP的情况下返回正确的格式
    let final_format = if options.format == "png-to-webp" {
        "webp".to_string()
    } else {
        options.format.clone()
    };

    Ok(ProcessResult {
        data: base64_data,
        format: final_format,
        size: buffer.len() as u32,
        width,
        height,
    })
}

// 根据需要调整图片大小
pub fn resize_image_if_needed(img: DynamicImage, max_width: Option<u32>, max_height: Option<u32>) -> DynamicImage {
    let (width, height) = img.dimensions();
    
    match (max_width, max_height) {
        (Some(max_w), Some(max_h)) => {
            if width > max_w || height > max_h {
                let ratio_w = max_w as f32 / width as f32;
                let ratio_h = max_h as f32 / height as f32;
                let ratio = ratio_w.min(ratio_h);
                
                let new_width = (width as f32 * ratio) as u32;
                let new_height = (height as f32 * ratio) as u32;
                
                img.resize(new_width, new_height, image::imageops::FilterType::Lanczos3)
            } else {
                img
            }
        },
        (Some(max_w), None) => {
            if width > max_w {
                let ratio = max_w as f32 / width as f32;
                let new_height = (height as f32 * ratio) as u32;
                
                img.resize(max_w, new_height, image::imageops::FilterType::Lanczos3)
            } else {
                img
            }
        },
        (None, Some(max_h)) => {
            if height > max_h {
                let ratio = max_h as f32 / height as f32;
                let new_width = (width as f32 * ratio) as u32;
                
                img.resize(new_width, max_h, image::imageops::FilterType::Lanczos3)
            } else {
                img
            }
        },
        (None, None) => img,
    }
}

// 移除图片元数据
pub fn strip_metadata(img: DynamicImage) -> DynamicImage {
    // 获取图像尺寸和格式
    let (width, height) = img.dimensions();
    
    // 根据图像类型创建对应格式的新图像
    match img {
        DynamicImage::ImageRgb8(_) => {
            // 复制RGB8图像数据到新图像
            let rgb_data = img.to_rgb8();
            DynamicImage::ImageRgb8(rgb_data)
        },
        DynamicImage::ImageRgba8(_) => {
            // 复制RGBA8图像数据到新图像
            let rgba_data = img.to_rgba8();
            DynamicImage::ImageRgba8(rgba_data)
        },
        DynamicImage::ImageLuma8(_) => {
            // 复制灰度图像数据到新图像
            let luma_data = img.to_luma8();
            DynamicImage::ImageLuma8(luma_data)
        },
        DynamicImage::ImageLumaA8(_) => {
            // 复制带Alpha通道的灰度图像数据到新图像
            let luma_alpha_data = img.to_luma_alpha8();
            DynamicImage::ImageLumaA8(luma_alpha_data)
        },
        // 移除不支持的变体，用通用处理替代
        _ => {
            // 对于其他类型，转换为RGBA8格式
            let rgba_data = img.to_rgba8();
            DynamicImage::ImageRgba8(rgba_data)
        }
    }
}

// 将格式字符串转换为MIME类型
pub fn format_to_mime(format: &str) -> String {
    match format.to_lowercase().as_str() {
        "jpg" | "jpeg" => "jpeg".to_string(),
        "png" => "png".to_string(),
        "gif" => "gif".to_string(),
        "webp" | "png-to-webp" => "webp".to_string(),
        _ => "jpeg".to_string(),
    }
} 