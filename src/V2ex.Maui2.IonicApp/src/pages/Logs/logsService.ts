import { apiService } from "../../services/apiService";
import { LogFile, LogFileContent } from "../../services/IV2exApiService";

export type { LogFile, LogFileContent };

export interface GetLogsResponse {
  files: LogFile[];
  error?: string;
}

export interface LogContentResponse extends LogFileContent {
  error?: string;
}

/**
 * 获取日志文件列表
 */
export async function getLogFiles(): Promise<GetLogsResponse> {
  const result = await apiService.getLogFiles();
  if (result.error !== null) {
      console.error("Error fetching log files:", result.error);
      return { files: [], error: result.error };
  }
  return result.data;
}

/**
 * 获取日志文件内容
 */
export async function getLogFileContent(
  fileName: string,
): Promise<LogContentResponse | null> {
  const result = await apiService.getLogFileContent(fileName);
  if (result.error !== null) {
      console.error("Error fetching log content:", result.error);
      return null;
  }
  return result.data;
}

/**
 * 删除日志文件
 */
export async function deleteLogFile(fileName: string): Promise<boolean> {
  const result = await apiService.deleteLogFile(fileName);
  return result.data ?? false;
}

/**
 * 清空所有日志文件
 */
export async function clearAllLogs(): Promise<boolean> {
  const result = await apiService.clearAllLogs();
  return result.data ?? false;
}

/**
 * 下载日志文件（转换为 base64）
 */
export async function downloadLogFile(fileName: string): Promise<void> {
  try {
    const logContent = await getLogFileContent(fileName);

    if (!logContent || logContent.error) {
      console.error("Failed to get log content for download");
      return;
    }

    // 将内容转为 blob
    const blob = new Blob([logContent.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放 URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download log file:", error);
  }
}
