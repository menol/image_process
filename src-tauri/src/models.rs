use serde::{Serialize, Deserialize};

// 图片处理选项结构体
#[derive(Serialize, Deserialize, Clone)]
pub struct ImageOptions {
    pub quality: u8,        // 压缩质量 (0-100)
    pub format: String,     // 输出格式 ("jpeg", "png", "gif", "webp")
    pub max_width: Option<u32>,  // 最大宽度
    pub max_height: Option<u32>, // 最大高度
    pub optimize: bool,     // 是否进行优化
    pub strip_metadata: bool, // 是否移除元数据
    pub progressive: bool,  // 是否使用渐进式JPEG
}

// 处理结果结构体
#[derive(Serialize, Clone)]
pub struct ProcessResult {
    pub data: String,       // base64编码的图片数据
    pub format: String,     // 图片格式
    pub size: u32,          // 图片大小(字节)
    pub width: u32,         // 图片宽度
    pub height: u32,        // 图片高度
}

// 批量处理结果结构体
#[derive(Serialize, Clone)]
pub struct BatchProcessResult {
    pub results: Vec<ProcessResult>,  // 处理结果列表
    pub success_count: usize,         // 成功处理的图片数量
    pub failed_count: usize,          // 处理失败的图片数量
}

// 图像复杂度枚举
pub enum ImageComplexity {
    Low,     // 简单图像，如logo、图标、简单图形
    Medium,  // 中等复杂度，如插图、简单照片
    High,    // 高复杂度，如细节丰富的照片、纹理
}

// 错误处理枚举
#[derive(Debug)]
pub enum ImageProcessError {
    DecodeError(String),
    EncodeError(String),
    InvalidFormat(String),
    IoError(String),
} 