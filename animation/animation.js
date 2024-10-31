import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
let svg;
let xAxis;
let yAxis;
let xScale;
let yScale;
let radiusScale;
let year = 1957;
let yearDataset;
let dataset;
let yearLabel;
let gdpExtent;
let lifeExpExtent;
let duration = 500;

async function prepareVis() {
  dataset = await d3.csv("../datasets/gapminder_full.csv", d3.autoType);
  dataset = dataset.filter((d) => d.country !== "Kuwait");

  gdpExtent = d3.extent(dataset, (d) => d.gdp_cap);
  lifeExpExtent = d3.extent(dataset, (d) => d.life_exp);
  // Global_Sales, JP_Sales
  //   yearDataset = dataset.filter((d) => d.year === year);

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
  radiusScale = d3.scaleLog().range([5, 25]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  yearLabel = svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height / 2);

  // add x axis
  xAxis = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  // add x axis label
  svg
    .append("text")
    .attr("class", "xLabel")
    .attr("x", width / 2)
    .attr("y", height - margin.bottom + 40)
    .text("GDP per Capita");

  // add y axis
  yAxis = svg.append("g").attr("transform", `translate(${margin.left}, 0)`);
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
  const continents = new Set(dataset.map((d) => d.continent));
  const legendSize = 20;
  const legendSpacing = 100;

  let i = 0;
  continents.forEach((continent) => {
    legend
      .append("rect")
      .attr("x", i * legendSpacing)
      .attr("width", legendSize)
      .attr("height", legendSize)
      .attr("fill", colorScale(continent));
    legend
      .append("text")
      .attr("x", i * legendSpacing + legendSize + 5)
      .attr("y", legendSize)
      .text(continent);
    i++;
  });
}

function drawVis(year) {
  yearDataset = dataset.filter((d) => d.year === year);
  // filter out Kuwait, which has an outlier GDP
  // sort year dataset by country
  yearDataset.sort((a, b) => d3.ascending(a.country, b.country));
  const populationExtent = d3.extent(yearDataset, (d) => d.population);
  const continents = new Set(yearDataset.map((d) => d.continent));
  yearLabel.text(year);
  xScale.domain([0, gdpExtent[1]]);
  yScale.domain(lifeExpExtent);

  const radiusScale = d3.scaleLinear().range([5, 12]);
  radiusScale.domain(populationExtent);
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(continents);
  svg
    .selectAll("circle")
    .data(yearDataset)
    .join("circle")
    .transition()
    .duration(duration)
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

  xAxis.transition().duration(duration).call(d3.axisBottom(xScale));
  // add axis label under axis

  yAxis.transition().duration(duration).call(d3.axisLeft(yScale));
}

async function runApp() {
  await prepareVis();

  // get unique years, sort by year, and then go through them once every two seconds.
  const years = Array.from(new Set(dataset.map((d) => d.year))).sort();
  let i = 0;
  const interval = setInterval(() => {
    let year = years[i];
    console.log(year);
    drawVis(year);
    i++;
    if (i >= years.length) {
      clearInterval(interval);
    }
  }, duration);
}

runApp();
