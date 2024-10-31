import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let year = 1957;
let svg;
let xAxis;
let yAxis;
let xScale;
let yScale;
let radiusScale;
let colorScale;
let yearDataset;
let dataset;
let yearLabel;
let gdpExtent;
let lifeExpExtent;
let populationExtent;
let duration = 500;
let continents;

async function prepareVis() {
  dataset = await d3.csv("../datasets/gapminder_full.csv", d3.autoType);
  dataset = dataset.filter((d) => d.country !== "Kuwait");
  //filter dataset to a specific year
  yearDataset = dataset.filter((d) => d.year === year);
  continents = new Set(yearDataset.map((d) => d.continent));
  gdpExtent = d3.extent(dataset, (d) => d.gdp_cap);
  lifeExpExtent = d3.extent(dataset, (d) => d.life_exp);
  populationExtent = d3.extent(yearDataset, (d) => d.population);

  const width = 800;
  const height = 600;

  const margin = { top: 10, right: 20, bottom: 100, left: 50 };

  svg = d3
    .select("#visContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

  // xScale for
  xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
  yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
  radiusScale = d3.scaleLog().range([5, 10]);
  colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  xScale.domain([0, gdpExtent[1]]);
  yScale.domain(lifeExpExtent);
  radiusScale.domain(populationExtent);
  colorScale.domain(continents);

  svg
    .selectAll("circle")
    .data(yearDataset)
    .join("circle")
    .attr("cx", (d) => {
      return xScale(d.gdp_cap);
    })
    .attr("cy", (d) => {
      return yScale(d.life_exp);
    })
    .attr("r", (d) => {
      return radiusScale(d.population);
    })
    .attr("fill", (d) => {
      return colorScale(d.continent);
    });

  // add x axis
  xAxis = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`);
  xAxis.call(d3.axisBottom(xScale));
  // add x axis label
  // add y axis
  yAxis = svg.append("g").attr("transform", `translate(${margin.left}, 0)`);
  yAxis.call(d3.axisLeft(yScale));

  // add y axis label and rotate it 90% in place
  svg
    .append("text")
    .attr("class", "yLabel")
    .attr("x", -300)
    .attr("y", 20)
    .attr("transform", "rotate(-90)")
    .text("Life Expectancy");

  // add legend for continents at the bottom center of the chart and add text
  const legend = svg
    .append("g")
    .attr(
      "transform",
      `translate(${width / 2}, ${height - margin.bottom + 60})`
    );

  const legendSize = 20;
  const legendSpacing = 100;

  let i = 0;
  legend
    .selectAll("rect")
    .data(continents)
    .join("rect")
    .attr("x", (d, i) => i * legendSpacing)
    .attr("width", legendSize)
    .attr("height", legendSize)
    .attr("fill", (d) => colorScale(d));
  legend
    .selectAll("text")
    .data(continents)
    .join("text")
    .attr("x", (d, i) => i * legendSpacing + legendSize + 5)
    .attr("y", legendSize)
    .text((d) => d)
    .attr("fill", "black")
    .attr("font-size", "12px");
}

async function runApp() {
  await prepareVis();
}

runApp();
