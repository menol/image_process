// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Serialize, Deserialize};

// 定义模块
mod models;
mod image_processor;
mod image_analysis;
mod commands;

// 导出公共接口
pub use commands::app_process_image;

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
    data: String,           // base64编码的图片数据
    format: String,         // 图片格式
    size: u32,             // 图片大小(字节)
    width: u32,            // 图片宽度
    height: u32,           // 图片高度
}

// 批量处理结果结构体
#[derive(Serialize, Clone)]
pub struct BatchProcessResult {
    results: Vec<ProcessResult>,  // 处理结果列表
    success_count: usize,         // 成功处理的图片数量
    failed_count: usize,          // 处理失败的图片数量
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![app_process_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}