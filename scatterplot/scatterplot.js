import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const dataset = [
  { platform: "PS2", global_sales: 400, jp_sales: 139 },
  { platform: "DS", global_sales: 2152, jp_sales: 1500 },
  { platform: "PS3", global_sales: 1331, jp_sales: 800 },
  { platform: "Wii", global_sales: 1320, jp_sales: 1500 },
  { platform: "X360", global_sales: 1262, jp_sales: 100 },
  { platform: "PSP", global_sales: 1209, jp_sales: 76 },
  { platform: "PC", global_sales: 4500, jp_sales: 250 },
  { platform: "XB", global_sales: 150, jp_sales: 180 },
  { platform: "GBA", global_sales: 120, jp_sales: 250 },
];

const width = 640;
const height = 400;

const margin = { top: 20, right: 40, bottom: 20, left: 40 };

const svg = d3
  .select("#visContainer")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);
const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const xExtent = d3.extent(dataset, (d) => d.global_sales);
const yExtent = d3.extent(dataset, (d) => d.jp_sales);

const xScale = d3.scaleLinear().domain([0, xExtent[1]]).range([0, width]);
const yScale = d3.scaleLinear().domain([0, yExtent[1]]).range([height, 0]);

console.log(xScale(2190));

g.selectAll("circle")
  .data(dataset)
  .join("circle")
  .attr("cx", (d) => {
    return xScale(d.global_sales);
  })
  .attr("cy", (d) => yScale(d.jp_sales))
  .attr("r", 10)
  .attr("width", 10)
  .attr("height", 10)
  .attr("fill", () => {
    return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(
      Math.random() * 255
    )}, ${Math.floor(Math.random() * 255)})`;
  });

g.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(xScale));

g.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(xScale));

g.append("g").call(d3.axisLeft(yScale));
