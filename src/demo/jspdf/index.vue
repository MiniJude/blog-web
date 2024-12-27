<template>
    <div>
        <button @click="generatePdf">生成 PDF</button>
    </div>
</template>

<script setup lang="ts">
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import image1 from './images/image1.png';
import image2 from './images/image2.png';
import image3 from './images/image3.png';

// 三张图片路径（使用 Vite 的 public 文件夹）
const images = [
    image1,
    image2,
    image3,
];

// 模拟的 106 条数据
const data = new Array(106).fill({
    code: '1234567890',
    baoDanNianDu: '2022',
    nianMoNianLing: '30',
    nianJiaoBaoXianFei: '10000',
    leijiaBaoXianFei: '50000',
    zhongDaJiBingBaoXianJin: '20000',
    shengGuBaoXianJin: '30000',
    xianJinJiaZhi: '40000',
});

const generatePdf = async () => {
    const doc = new jsPDF('p', 'px', [539, 1192]); // 创建和图片宽高一样的纵向 PDF
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 每页图片加载和表格填充
    const rowsPerPage = 35; // 每页 35 行数据，与你的表格布局匹配

    for (let i = 0; i < images.length; i++) {
        // 加载图片
        const { base64 } = await loadImage(images[i]);
        // 添加图片到页面
        doc.addImage(base64, 'PNG', 0, 0, pageWidth, pageHeight);

        // 获取当前页数据
        const pageData = data.slice(i * rowsPerPage, (i + 1) * rowsPerPage);

        // 在图片上填充表格数据
        autoTable(doc, {
            startY: 150, // 表格的起始 Y 坐标，根据图片调整
            margin: { left: 40 }, // 表格左侧边距
            // head: [['保单代码', '保单年度', '年末年龄', '年交保费', '累计保费', '重大疾病保险金', '身故保险金', '现金价值']],
            body: pageData.map((item) => [
                item.nianMoNianLing,
                item.nianJiaoBaoXianFei,
                item.leijiaBaoXianFei,
                item.zhongDaJiBingBaoXianJin,
                item.shengGuBaoXianJin,
                item.xianJinJiaZhi,
            ]),
            styles: {
                fontSize: 10, // 设置字体大小
                lineWidth: 0, // 隐藏边框
                cellPadding: {
                    top: 10, // 单元格顶部内边距
                    right: 10, // 单元格右侧内边距
                    bottom: 10, // 单元格底部内边距
                    left: 10, // 单元格左侧内边距
                }
            },
            tableLineColor: false, // 表格线颜色设置为白色
            tableLineWidth: 0, // 去掉表格边框
            bodyStyles: {
                fillColor: false,
                textColor: [0, 0, 0], // 表格内容文字颜色
                lineColor: false, // 单元格边框颜色
                lineWidth: 0, // 去掉单元格边框
            },
            alternateRowStyles: {
                fillColor: false, // 去掉交替行的背景色
            },
        });

        // 如果不是最后一页，添加新页面
        if (i < images.length - 1) {
            doc.addPage();
        }
    }

    // 下载 PDF 文件
    doc.save('保单数据表.pdf');
};

// 工具函数：加载图片
const loadImage = (src: string): Promise<{
    base64: string;
    width: number;
    height: number;
}> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 允许跨域加载
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, img.width, img.height);
                resolve({
                    base64: canvas.toDataURL('image/png'),
                    width: img.width,
                    height: img.height,
                });
            } else {
                reject(new Error('无法加载图片'));
            }
        };
        img.onerror = reject;
    });
};
</script>
