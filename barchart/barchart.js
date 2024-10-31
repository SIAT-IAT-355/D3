import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm";

async function drawVis() {
  const dataset = await d3.csv("../datasets/videogames_wide.csv", d3.autoType);
  console.log(dataset);
  // Global_Sales, JP_Sales

  const width = 640;
  const height = 400;

  const margin = { top: 10, right: 20, bottom: 20, left: 50 };

  const svg = d3
    .select("#visContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

  // group dataset by Immigration program and sum Invitations issued
  const df = _(dataset)
    .groupBy("Genre")
    .map((objs, key) => ({
      Genre: key,
      Global_Sales: _.sumBy(objs, "Global_Sales"),
    }))
    .value();
  console.log(df);

  // add x axis
  const SalesExtent = d3.extent(df, (d) => d["Global_Sales"]);
  const Genres = df.map((d) => d["Genre"]);

  const xScale = d3
    .scaleBand()
    .domain(Genres)
    .range([margin.left, width - margin.right])
    .padding(0.1);
  const yScale = d3
    .scaleLinear()
    .domain(SalesExtent)
    .range([height - margin.bottom, margin.top]);

  svg
    .selectAll("rect")
    .data(df)
    .join("rect")
    .attr("x", (d) => {
      return xScale(d["Genre"]);
    })
    .attr("y", (d) => {
      return yScale(d["Global_Sales"]);
    })
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => {
      return height - margin.bottom - yScale(d["Global_Sales"]);
    });

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
