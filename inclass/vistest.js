import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

async function drawVis() {
  const dataset = await d3.csv("./datasets/videogames_wide.csv", d3.autoType);

  // Global_Sales, JP_Sales
  console.log(dataset);

  const width = 640;
  const height = 400;

  const margin = { top: 10, right: 20, bottom: 20, left: 30 };

  const svg = d3
    .select("#visContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

  const maxGlobalSales = d3.max(dataset, (d) => d.Global_Sales);
  const maxJpSales = d3.max(dataset, (d) => d.JP_Sales);
  const xScale = d3
    .scaleLinear()
    .domain([0, maxGlobalSales])
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([0, maxJpSales])
    .range([height - margin.bottom, margin.top]);

  const colorScale = d3
    .scaleLinear()
    .domain([0, maxGlobalSales])
    .range(["blue", "red"]);

  svg
    .selectAll("circle")
    .data(dataset)
    .join("circle")
    .attr("cx", (d) => {
      return xScale(d.Global_Sales);
    })
    .attr("cy", (d) => {
      return yScale(d.JP_Sales);
    })
    .attr("r", 2)
    .attr("fill", (d) => {
      try {
        if (d.Name.toLowerCase().includes("mario")) {
          return "red";
        } else {
          return "grey";
        }
      } catch (error) {
        console.log(d);
      }
      // return "red";
    });

  // add x axis

  svg
    .append("g")
    .call(d3.axisBottom(xScale))
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  svg
    .append("g")
    .call(d3.axisLeft(yScale))
    .attr("transform", `translate(${margin.left}, 0)`);
}

drawVis();
