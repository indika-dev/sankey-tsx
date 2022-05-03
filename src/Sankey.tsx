import * as React from "react";
import "./sankey.css";
import * as d3 from "d3";
import { schemeCategory20, select, scaleOrdinal, drag, rgb } from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

interface ITotal {
  visited: Number;
  registered: Number;
  attended: Number;
}

interface INode {
  node: Number;
  type: String;
  name: String;
  visited: String;
}

interface ILink {
  source: Number;
  target: Number;
  value: Number;
}

interface ITabItem {
  name: String;
  nodes: INode[];
  links: ILink[];
}

interface IProp {
  title: string;
  total: ITotal;
  tabs: ITabItem[];
  svgWidth: number;
  svgHeight: number;
  nodeWidth: number;
  linkStrokeWidth: number;
}

interface IState {
  selectedId: Number;
}

class Sankey extends React.Component<IProp, IState> {
  public readonly state: IState = {
    selectedId: 0
  };

  private sankeyNode: any;

  private tabClicked = (event: React.MouseEvent<HTMLElement>) => {
    const id: string = event.currentTarget.id;
    this.setState(() => ({
      selectedId: Number(id)
    }));
  };

  public componentDidMount() {
    this.renderSankey(this.props.tabs[this.state.selectedId]);
  }
  public componentDidUpdate() {
    this.renderSankey(this.props.tabs[this.state.selectedId]);
  }

  private tabItems(tabs: ITabItem[]) {
    return tabs.map(({ name }: ITabItem, index: Number) => {
      const classes: string =
        "tabTitle" + (index === this.state.selectedId ? " selected" : "");
      return (
        <div onClick={this.tabClicked} id={String(index)} className={classes}>
          {name}
        </div>
      );
    });
  }

  private total(total: ITotal) {
    const format = d3.format(",");
    return (
      <div>
        <div className="total-node">
          <div className="total-label">Attended</div>
          <div className="total-value">{format(total.attended)}</div>
        </div>
        <div className="total-node">
          <div className="total-label">Registered</div>
          <div className="total-value">{format(total.registered)}</div>
        </div>
        <div className="total-node">
          <div className="total-label">Visited</div>
          <div className="total-value">{format(total.visited)}</div>
        </div>
      </div>
    );
  }

  private renderSankey(tabItem: ITabItem) {
    const node = this.sankeyNode;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 },
      width = (this.props.svgWidth || 1050) - margin.left - margin.right,
      height = (this.props.svgHeight || 400) - margin.top - margin.bottom;
    //remove the currently existing drawings
    select(node).select("g").remove();
    const svg = select(node)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const graph: ITabItem = tabItem;
    graph.nodes.forEach((d: any, index: number) => {
      d.fixedValue = 3;
    });
    const nodeWidth = this.props.nodeWidth || 40;
    const sankeyGraph = sankey()
      .nodeId((d: any, index: Number) => index)
      .nodeWidth(nodeWidth)
      .size([width, height - 5])
      .nodeSort(null);
    sankeyGraph(graph);

    //define the linear gradients
    const nodesData = graph.nodes.filter((d: any) => !d.color);
    const linksData = graph.links.filter((d: any) => !d.color);
    const gradientsData = [...nodesData, ...linksData];
    const def = select(node).append("defs");
    const linearGradient = def
      .selectAll(".linear-gradient")
      .data(gradientsData)
      .enter()
      .append("linearGradient")
      .attr("id", (d: any) => {
        if (d.source && d.target) {
          return `linear-gradient-link-${d.index}`;
        }
        return `linear-gradient-${d.index}`;
      })
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    //.attr("gradientUnits", "objectBoundingBox");

    //Set the color for the start (0%)
    linearGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", (d: any) => d.startColor);

    //Set the color for the end (100%)
    linearGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", (d: any) => d.endColor);

    const strokeWidth = this.props.linkStrokeWidth;
    const linkG = svg
      .selectAll(".link")
      .data(graph.links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d: any) => {
        const path = sankeyLinkHorizontal()(d);
        const match = path.match(/,([^C]+)C/);
        if (match.length !== 2) {
          return path;
        }
        const replacementValue = +match[1] + 0.01;
        const fixedPath = path.replace(match[1], "" + replacementValue);
        return fixedPath;
      })
      .style("stroke", (d: any, index: Number) => {
        return `url(#linear-gradient-link-${0})`;
      })
      .style("stroke-width", function (d: any) {
        return strokeWidth || 40;
      })
      .sort(function (a: any, b: any) {
        return b.dy0 - a.dy0;
      });

    var nodeG = svg
      .append("g")
      .selectAll(".node")
      .data(graph.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d: any) {
        return "translate(" + d.x0 + "," + d.y0 + ")";
      });

    nodeG
      .append("rect")
      .attr("x", -2)
      .attr("y", -2)
      .attr("height", function (d: any) {
        return (d.height = d.y1 - d.y0 + 4);
      })
      .attr("width", nodeWidth + 4)
      .style("fill", function (d: any) {
        return d.color || `url(#linear-gradient-${d.index})`;
      })
      .style("rx", 6);

    // category
    nodeG
      .append("text")
      .attr("x", 0.2 * nodeWidth)
      .attr("y", function (d: any) {
        if (d.index < 1) return d.height * 0.63;
        return d.height * 0.33;
      })
      .style("fill", (d: any) => {
        return d.index > 0 ? "white" : "black";
      })
      .html((d: any) => {
        return d.type;
      });

    //visited
    nodeG
      .append("text")
      .attr("x", 0.2 * nodeWidth)
      .attr("y", function (d: any) {
        return d.height * 0.6;
      })
      .style("font-weight", "bold")
      .style("fill", (d: any) => {
        return d.index > 0 ? "white" : "black";
      })
      .html((d: any) => {
        return d.name || d.visited || "67";
      });

    //visited
    nodeG
      .append("text")
      .attr("x", 0.2 * nodeWidth)
      .attr("y", function (d: any) {
        return d.height * 0.82;
      })
      .style("font-size", 12)
      .style("fill", (d: any) => {
        return d.index > 0 ? "white" : "black";
      })
      .text((d: any) => d.category);
    console.log(graph.nodes);
  }

  public render() {
    const { title, total, tabs } = this.props;
    return (
      <div className="sankey-container">
        <div className="title">{title}</div>
        {this.tabItems(tabs)}
        <div style={{ maringTop: "40px" }}>
          <svg
            width="100%"
            height="100%"
            ref={(node) => {
              this.sankeyNode = node;
            }}
          ></svg>
          <div style={{ width: "40%", margin: "0 auto", paddingTop: "24px" }}>
            {this.total(total)}
          </div>
        </div>
      </div>
    );
  }
}

export default Sankey;
