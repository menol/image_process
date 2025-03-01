use rayon::prelude::*;
use serde_json;

use crate::models::{ImageOptions, BatchProcessResult};
use crate::image_processor::process_single_image;

#[tauri::command]
pub async fn app_process_image(base64_data_list: Vec<String>, options_json: String) -> Result<BatchProcessResult, String> {
    let options: ImageOptions = match serde_json::from_str(&options_json) {
        Ok(opts) => opts,
        Err(e) => return Err(format!("解析选项失败: {}", e)),
    };
    
    // 使用rayon并行处理所有图片
    let results: Vec<_> = base64_data_list.par_iter()
        .map(|base64_data| process_single_image(base64_data.clone(), options.clone()))
        .collect();
    
    // 统计处理结果
    let mut success_results = Vec::new();
    let mut failed_count = 0;
    
    for result in results {
        match result {
            Ok(process_result) => success_results.push(process_result),
            Err(_) => failed_count += 1,
        }
    }
    
    Ok(BatchProcessResult {
        results: success_results.clone(),
        success_count: success_results.len(),
        failed_count,
    })
} 