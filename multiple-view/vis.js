import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm";
// import loadash

let barchart, scatterplot;
let dataset, years, continents;
let currentYearIndex = 0;
let barchartVar = "population";

async function prepareData() {
  dataset = await d3.csv("../datasets/gapminder_full.csv", d3.autoType);
  dataset = dataset.filter((d) => d.country !== "Kuwait");
  console.log(dataset);
  years = Array.from(new Set(dataset.map((d) => d.year)));
  continents = new Set(dataset.map((d) => d.continent));
}

function renderBarchart() {
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const width = 400;
  const height = 300;

  const svg = d3
    .select("#barchartContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  const xScale = d3
    .scaleBand()
    .domain(continents)
    .range([margin.left, width - margin.right])
    .padding(0.1);

  this.update = () => {
    let data = dataset.filter((d) => d.year === years[currentYearIndex]);
    // group by and average continent data based on barchartVar by million

    // add a title for the chart that says the selected continent (or all continents) and the year

    let df = _(data)
      .groupBy("continent")
      .map((objs, key) => ({
        continent: key,
        [barchartVar]: _.meanBy(objs, barchartVar),
      }))
      .value();

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(df, (d) => d[barchartVar])])
      .range([height - margin.bottom, margin.top]);

    this.bars = svg
      .selectAll("rect")
      .data(df)
      .join("rect")
      .attr("fill", (d) =>
        this.selectedContinent === d.continent ? "red" : "steelblue"
      )
      .attr("x", (d) => xScale(d.continent))
      .attr("y", (d) => yScale(d[barchartVar]))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - margin.bottom - yScale(d[barchartVar]));

    // add x axis
    this.xAxis = svg
      .selectAll(".x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    // add y axis format numbers by million
    this.yAxis = svg
      .selectAll(".y-axis")
      .data([null])
      .join("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));

    // add y axis title
    svg
      .selectAll(".y-axis-title")
      .data([null])
      .join("text")
      .attr("class", "y-axis-title")
      .attr("x", -height / 2)
      .attr("y", 10)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text(barchartVar);

    this.bars.on("click", (event, d) => {
      this.selectedContinent =
        this.selectedContinent === d.continent ? null : d.continent;
      this.bars.attr("fill", (d) =>
        this.selectedContinent === d.continent ? "red" : "steelblue"
      );
      scatterplot.selectedContinent = this.selectedContinent;
      scatterplot.update();
    });
  };
}

// scatterplot showing gdp vs life expectancy of selected continent
function renderScatterplot() {
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const width = 500;
  const height = 500;

  this.selectedContinent = null;

  this.svg = d3
    .select("#scatterplotContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  this.update = () => {
    let data = dataset.filter((d) => d.year === years[currentYearIndex]);
    if (this.selectedContinent) {
      data = data.filter((d) => d.continent === this.selectedContinent);
    }

    this.svg
      .selectAll(".title")
      .data([null])
      .join("text")
      .attr("class", "title")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text(
        `${
          this.selectedContinent ? this.selectedContinent : "All Continents"
        } ${years[currentYearIndex]}`
      );

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.gdp_cap))
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.life_exp))
      .range([height - margin.bottom, margin.top]);

    this.circles = this.svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => xScale(d.gdp_cap))
      .attr("cy", (d) => yScale(d.life_exp))
      .attr("r", 5)
      .attr("fill", "steelblue");

    this.xAxis = this.svg
      .selectAll(".x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    // add x axis title
    this.svg
      .selectAll(".x-axis-title")
      .data([null])
      .join("text")
      .attr("class", "x-axis-title")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("GDP per Capita");

    this.yAxis = this.svg
      .selectAll(".y-axis")
      .data([null])
      .join("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // add y axis title
    this.svg
      .selectAll(".y-axis-title")
      .data([null])
      .join("text")
      .attr("class", "y-axis-title")
      .attr("x", -height / 2)
      .attr("y", 10)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Life Expectancy");
  };
}

async function runApp() {
  await prepareData();
  barchart = new renderBarchart();
  scatterplot = new renderScatterplot();

  barchart.update();
  scatterplot.update();
}
runApp();
