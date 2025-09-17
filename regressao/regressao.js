import * as XLSX from "xlsx";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";

function carregarDadosExcel(caminhoArquivo) {
    const workbook = XLSX.readFile(caminhoArquivo);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const x = [];
    const y = [];
    for (let i = 1; i < data.length; i++) {
        x.push(Number(data[i][0]));
        y.push(Number(data[i][1]));
    }
    return { x, y };
}

function regressaoLinear(x, y) {
    const n = x.length;
    const media = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const mediaX = media(x);
    const mediaY = media(y);

    let numerador = 0;
    let denominador = 0;
    for (let i = 0; i < n; i++) {
        numerador += (x[i] - mediaX) * (y[i] - mediaY);
        denominador += (x[i] - mediaX) ** 2;
    }

    const a = numerador / denominador;
    const b = mediaY - a * mediaX;

    let somaTotal = 0;
    let somaResiduos = 0;
    for (let i = 0; i < n; i++) {
        const yEstimado = a * x[i] + b;
        somaTotal += (y[i] - mediaY) ** 2;
        somaResiduos += (y[i] - yEstimado) ** 2;
    }

    const r2 = 1 - (somaResiduos / somaTotal);

    let diagnostico = "";
    if (r2 >= 0.9) diagnostico = "Ótimo";
    else if (r2 >= 0.7) diagnostico = "Bom";
    else if (r2 >= 0.5) diagnostico = "Razoável";
    else diagnostico = "Fraco";

    return { a, b, r2: r2.toFixed(4), diagnostico };
}

async function gerarGrafico(x, y, a, b) {
    const width = 800;
    const height = 600;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const yEstimado = x.map(valorX => a * valorX + b);

    const configuration = {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: "Dados Originais",
                    data: x.map((xi, i) => ({ x: xi, y: y[i] })),
                    backgroundColor: "blue"
                },
                {
                    label: "Reta de Regressão",
                    data: x.map((xi, i) => ({ x: xi, y: yEstimado[i] })),
                    type: "line",
                    borderColor: "red",
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                x: { type: "linear", position: "bottom" }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    fs.writeFileSync("grafico.png", image);
    console.log("Gráfico gerado: grafico.png");
}

// --- Uso ---
const { x, y } = carregarDadosExcel("dados.xlsx");
const resultado = regressaoLinear(x, y);

console.log("Coeficiente angular (a):", resultado.a);
console.log("Coeficiente linear (b):", resultado.b);
console.log("R²:", resultado.r2);
console.log("Diagnóstico:", resultado.diagnostico);

await gerarGrafico(x, y, resultado.a, resultado.b);
