const margin = { top: 40, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const t = 750;

let allHeatmapData = [];
let allLineData = [];
let currentCrime = "THEFT";

let heatX, heatY, heatColor;
let lineX, lineY;

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const hoursOfDay = d3.range(24);

const svgHeatmap = d3
  .select("#heatmap-vis")
  .append("svg")
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`,
  )
  .style("max-width", "100%")
  .style("height", "auto")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const svgLine = d3
  .select("#linegraph-vis")
  .append("svg")
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`,
  )
  .style("max-width", "100%")
  .style("height", "auto")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

function init() {
  Promise.all([
    d3.json("./data/heatmap_data.json"),
    d3.json("./data/linegraph_data.json"),
  ])
    .then((datasets) => {
      allHeatmapData = datasets[0];

      allLineData = datasets[1].map((d) => ({
        ...d,
        date: new Date(d.Year, d.Month_Num - 1),
      }));

      setupSelector();
      updateAxes();
      updateVis();
    })
    .catch((error) => console.error("Error loading data:", error));
}

// dropdown
function setupSelector() {
  d3.select("#crime-selector").on("change", function () {
    currentCrime = d3.select(this).property("value");
    updateAxes();
    updateVis();
  });
}

// axes and scales update
function updateAxes() {
  let currentHeat = allHeatmapData.filter(
    (d) => d["Primary Type"] === currentCrime,
  );
  let currentLine = allLineData.filter(
    (d) => d["Primary Type"] === currentCrime,
  );

  svgHeatmap.selectAll(".axis").remove();

  heatX = d3.scaleBand().domain(hoursOfDay).range([0, width]).padding(0.05);

  heatY = d3.scaleBand().domain(d3.range(7)).range([0, height]).padding(0.05);

  heatColor = d3
    .scaleSequential(d3.interpolateYlOrRd)
    .domain([0, d3.max(currentHeat, (d) => d.IncidentCount)]);

  svgHeatmap
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(heatX).tickFormat((d) => {
        if (d === 0) return "12am";
        if (d === 12) return "12pm";
        return d < 12 ? `${d}am` : `${d - 12}pm`;
      }),
    );

  svgHeatmap
    .append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(heatY).tickFormat((d) => daysOfWeek[d]));

  svgLine.selectAll(".axis").remove();

  lineX = d3
    .scaleTime()
    .domain(d3.extent(allLineData, (d) => d.date))
    .range([0, width]);

  lineY = d3
    .scaleLinear()
    .domain([0, d3.max(currentLine, (d) => d.IncidentCount)])
    .range([height, 0]);

  svgLine
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(lineX));

  svgLine.append("g").attr("class", "axis").call(d3.axisLeft(lineY));
}

// visualization update
function updateVis() {
  let currentHeat = allHeatmapData.filter(
    (d) => d["Primary Type"] === currentCrime,
  );
  let currentLine = allLineData.filter(
    (d) => d["Primary Type"] === currentCrime,
  );

  // heatmap update
  svgHeatmap
    .selectAll(".heat-rect")
    .data(currentHeat, (d) => `${d.Day_Num}:${d.Hour}`)
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("class", "heat-rect")
          .attr("x", (d) => heatX(d.Hour))
          .attr("y", (d) => heatY(d.Day_Num))
          .attr("width", heatX.bandwidth())
          .attr("height", heatY.bandwidth())
          .style("fill", "#fff")
          .call((enter) =>
            enter
              .transition()
              .duration(t)
              .style("fill", (d) => heatColor(d.IncidentCount)),
          ),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(t)
            .style("fill", (d) => heatColor(d.IncidentCount)),
        ),
      (exit) => exit.remove(),
    )
    // heatmap tooltip
    .on("mouseover", function (event, d) {
      d3.select("#tooltip")
        .style("display", "block")
        .html(
          `<strong>${daysOfWeek[d.Day_Num]} at ${d.Hour}:00</strong><br/>Incidents: ${d.IncidentCount.toLocaleString()}`,
        )
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 20 + "px");
      d3.select(this).style("stroke", "#000").style("stroke-width", 2);
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("display", "none");
      d3.select(this).style("stroke", "none");
    });

  const minYear = d3.min(allLineData, (d) => d.Year);
  const maxYear = d3.max(allLineData, (d) => d.Year);
  const years = d3.range(minYear, maxYear + 1);

  svgLine
    .selectAll(".summer-shade")
    .data(years)
    .join("rect")
    .attr("class", "summer-shade")
    // starts June 1st (month index 5) and ends August 31st (month index 7)
    .attr("x", (d) => lineX(new Date(d, 5, 1)))
    .attr("width", (d) => {
      const startX = lineX(new Date(d, 5, 1));
      const endX = lineX(new Date(d, 7, 31));
      return Math.max(0, endX - startX);
    })
    .attr("y", 0)
    .attr("height", height)
    .style("fill", "#f1c40f")
    .style("opacity", 0.15)
    .style("pointer-events", "none");

  // update the line path
  const lineGenerator = d3
    .line()
    .x((d) => lineX(d.date))
    .y((d) => lineY(d.IncidentCount));

  svgLine
    .selectAll(".trend-line")
    .data([currentLine])
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", "trend-line")
          .attr("fill", "none")
          .attr("stroke", "#2c3e50")
          .attr("stroke-width", 2)
          .attr("d", lineGenerator)
          .style("opacity", 0)
          .call((enter) => enter.transition().duration(t).style("opacity", 1)),
      (update) =>
        update.call((update) =>
          update.transition().duration(t).attr("d", lineGenerator),
        ),
      (exit) => exit.remove(),
    );

  svgLine
    .selectAll(".hover-dot")
    .data(currentLine, (d) => d.date)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "hover-dot")
          .attr("cx", (d) => lineX(d.date))
          .attr("cy", (d) => lineY(d.IncidentCount))
          .attr("r", 4)
          .style("fill", "#e74c3c")
          .style("opacity", 0),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(t)
            .attr("cx", (d) => lineX(d.date))
            .attr("cy", (d) => lineY(d.IncidentCount)),
        ),
      (exit) => exit.remove(),
    )
    .on("mouseover", function (event, d) {
      d3.select(this).style("opacity", 1);
      d3.select("#tooltip")
        .style("display", "block")
        .html(
          `<strong>${d.Month_Num}/${d.Year}</strong><br/>Incidents: ${d.IncidentCount.toLocaleString()}`,
        )
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).style("opacity", 0);
      d3.select("#tooltip").style("display", "none");
    });
}

window.addEventListener("load", init);
