import { callMauiBridge } from "../../services/mauiBridgeApi";

export interface LogFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
}

export interface LogFileContent {
  fileName: string;
  content: string;
  size: number;
  lastModified: string;
}

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
  try {
    const result = await callMauiBridge("GetLogFilesAsync");

    if (result.error !== null) {
      console.error("Error fetching log files:", result.error);
      return { files: [], error: result.error };
    }

    const data = JSON.parse(result.data);
    return data;
  } catch (error) {
    console.error("Failed to get log files:", error);
    return { files: [], error: String(error) };
  }
}

/**
 * 获取日志文件内容
 */
export async function getLogFileContent(
  fileName: string,
): Promise<LogContentResponse | null> {
  try {
    const result = await callMauiBridge("GetLogFileContentAsync", [fileName]);

    if (result.error !== null) {
      console.error("Error fetching log content:", result.error);
      return null;
    }

    return JSON.parse(result.data);
  } catch (error) {
    console.error("Failed to get log file content:", error);
    return null;
  }
}

/**
 * 删除日志文件
 */
export async function deleteLogFile(fileName: string): Promise<boolean> {
  try {
    const result = await callMauiBridge("DeleteLogFileAsync", [fileName]);

    if (result.error !== null) {
      console.error("Error deleting log file:", result.error);
      return false;
    }

    const response = JSON.parse(result.data);
    return response.success || false;
  } catch (error) {
    console.error("Failed to delete log file:", error);
    return false;
  }
}

/**
 * 清空所有日志文件
 */
export async function clearAllLogs(): Promise<boolean> {
  try {
    const result = await callMauiBridge("ClearAllLogsAsync");

    if (result.error !== null) {
      console.error("Error clearing logs:", result.error);
      return false;
    }

    const response = JSON.parse(result.data);
    return response.success || false;
  } catch (error) {
    console.error("Failed to clear logs:", error);
    return false;
  }
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
