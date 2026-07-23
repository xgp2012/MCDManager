#!/bin/bash
# MCDManager 本地开发环境依赖安装脚本
# 安装 daemon 和 web 组件的 npm 依赖

BASE_PATH=$(pwd)

cd "${BASE_PATH}/daemon" && npm install --production --no-fund --no-audit

cd "${BASE_PATH}/web" && npm install --production --no-fund --no-audit

echo "----------------------------"
echo "MCDManager dependencies done!"
echo "----------------------------"