const margin = {top: 40, right: 40, bottom: 40, left: 60};
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scaleLinear() // a numeric / quantative scale
    .domain([0, 100]) // prefined data range
    .range([0, width]);

  const yScale = d3.scaleLinear()
  .domain([0, 100]) // prefined data range
  .range([height, 0]);

const xAxis = d3.axisBottom(xScale);
svg.append('g')
   .attr('transform', `translate(0,${height})`)
   .call(xAxis);

const yAxis = d3.axisLeft(yScale);
yAxis.ticks(4, "s");
svg.append('g')
    .attr('class', 'y-axis')
    .call(yAxis);

svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .style('text-anchor', 'middle')
    .text('X Value');

svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 15)
    .style('text-anchor', 'middle')
    .text('Y Value');

let currentData = [];

d3.json('data/data.json')
    .then(data => {
        console.log(data)
        currentData = data.points
        updateVis()
    })
    .catch(error => console.error('Error loading data:', error))

  function updateVis(){
      svg.selectAll('.point')
          .data(currentData)
          .join(
              enter => enter
                  .append('circle')
                  .attr('class', 'point')
                  .attr('cx', d => xScale(d.x))
                  .attr('cy', d => yScale(d.y))
                  .attr('r', 0)
                  .style('fill', d => d.color)
                  .call(enter => enter.transition().duration(500).attr('r', 5)),
              update => update
                  .call(update => update.transition().duration(500)
                      .attr('cx', d => xScale(d.x))
                      .attr('cy', d => yScale(d.y))),
              exit => exit
                  .call(exit => exit.transition().duration(500).attr('r', 0).remove())
          )
  }

function addRandomPoint() {
    console.log('add point')
    const newPoint = {
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: 'red'
    };
    currentData.push(newPoint);
    updateVis();
}

function removeRandomPoint() {
    console.log('remove point')
    currentData.pop();
    updateVis();
}

function updateRandomPoints() {
    console.log('update points')
    currentData = currentData.map(d => ({
        id: currentData.length + 1,
        x: Math.min(100, Math.max(0, d.x + (Math.random() * 20 - 10))),
        y: Math.min(100, Math.max(0, d.y + (Math.random() * 20 - 10))),
        color: d.color
    }));
    updateVis();
}

d3.select('#addPoint')
    .on('click', addRandomPoint);

d3.select('#removePoint')
    .on('click', removeRandomPoint);

d3.select('#updatePoints')
    .on('click', updateRandomPoints);
