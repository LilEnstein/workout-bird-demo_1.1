import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Thêm dòng này vào để tối ưu cho Docker
  output: "standalone",
  
  // Các config khác (nếu có) giữ nguyên
};

export default nextConfig;  