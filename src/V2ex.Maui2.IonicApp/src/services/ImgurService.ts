/**
 * Imgur Image Upload Service
 *
 * 使用 Imgur 匿名上传 API 托管图片
 * 文档: https://apidocs.imgur.com/#c85c9dfc-7487-4de2-9ecd-66f727cf3139
 */

// Imgur Client ID 池 - 随机选择以分散请求
const imgurClientIdPool = [
  "3107b9ef8b316f3",
  "442b04f26eefc8a",
  "59cfebe717c09e4",
  "60605aad4a62882",
  "6c65ab1d3f5452a",
  "83e123737849aa9",
  "9311f6be1c10160",
  "c4a4a563f698595",
  "81be04b9e4a08ce",
];

/**
 * 随机获取一个 Client ID
 */
function getRandomClientId(): string {
  const index = Math.floor(Math.random() * imgurClientIdPool.length);
  return imgurClientIdPool[index];
}

const IMGUR_UPLOAD_URL = "https://api.imgur.com/3/image";

export interface ImgurUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 上传图片到 Imgur
 * @param base64Data Base64 编码的图片数据 (不含 data:image/xxx;base64, 前缀)
 * @returns 上传结果，包含图片 URL 或错误信息
 */
export async function uploadImageToImgur(
  base64Data: string,
): Promise<ImgurUploadResult> {
  try {
    // 移除可能存在的 data URL 前缀
    let cleanBase64 = base64Data;
    if (base64Data.includes(",")) {
      cleanBase64 = base64Data.split(",")[1];
    }

    const formData = new FormData();
    formData.append("image", cleanBase64);
    formData.append("type", "base64");

    // 随机选择一个 Client ID
    const clientId = getRandomClientId();

    const response = await fetch(IMGUR_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${clientId}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const imageUrl = result.data?.link;
      if (imageUrl) {
        console.log("[ImgurService] Upload successful:", imageUrl);
        return {
          success: true,
          url: imageUrl,
        };
      }
    }

    // 处理错误响应
    const errorMessage =
      result.data?.error || result.data?.error?.message || "Upload failed";
    console.error("[ImgurService] Upload failed:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    console.error("[ImgurService] Upload error:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 将图片 URL 转换为 Markdown 格式
 */
export function toMarkdownImage(url: string, alt = "image"): string {
  //   return `![${alt}](${url})`;

  return `${url}`;
}
