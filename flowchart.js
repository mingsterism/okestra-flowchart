import { EventEmitter } from "events";

// var $ = require("./node_modules/jquery/dist/jquery");
// var panzoom = require("jquery.panzoom");
function int(string) {
  return parseInt(string);
}

function generateRandomString() {
  return Math.random()
    .toString(36)
    .substring(7);
}

function panzoomHandler(flowchartElement, flowchartElementJS, container) {
  var cx = flowchartElement.width() / 2;
  var cy = flowchartElement.height() / 2;
  var centerX = -cx + container.width() / 2;
  var centerY = -cy + container.height() / 2;
  var possibleZooms = [0.5, 0.75, 1, 2, 3];
  var currentZoom = 2;

  panzoom(flowchartElementJS);

  flowchartElement.panzoom("pan", centerX, centerY);

  // Panzoom zoom handling...
  container.on("mousewheel.focal", function(e) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta || e.originalEvent.detail;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    currentZoom = Math.max(
      0,
      Math.min(possibleZooms.length - 1, currentZoom + (zoomOut * 2 - 1))
    );
    flowchartElement.flowchart("setPositionRatio", possibleZooms[currentZoom]);
    flowchartElement.panzoom("zoom", possibleZooms[currentZoom], {
      animate: false,
      focal: e
    });
  });
}

function deleteOperatorHandler(flowchartElement) {
  flowchartElement
    .parent()
    .siblings()
    .children(".delete_selected_button")
    .click(function() {
      console.log("DELETING");
      flowchartElement.flowchart("deleteSelected", this);
    });
}

function initializeFlowChart(flowchartElement, data) {
  flowchartElement.flowchart({
    data,
    linkWidth: 5
  });
}

function setInAndOutAttribute(dataObject) {
  const { data, nbInputs, nbOutputs } = dataObject;
  var i = 0;
  for (i = 0; i < nbInputs; i++) {
    data.properties.inputs["input_" + i] = {
      label: ""
    };
  }
  for (i = 0; i < nbOutputs; i++) {
    data.properties.outputs["output_" + i] = {
      label: ""
    };
  }

  return data;
}

function getOperatorData(element) {
  var nbInputs = int(element.data("nb-inputs"));
  var nbOutputs = int(element.data("nb-outputs"));
  var shape = element.data("shape");
  var func = element.data("function");
  let random = func === "decider" ? generateRandomString() : null;
  var data = {
    properties: {
      title: element.text(),
      inputs: {},
      outputs: {},
      shape,
      func,
      random,
      objectId: ""
    }
  };
  return setInAndOutAttribute({ data, nbInputs, nbOutputs });
}

function createApproveDeleteOperator(title, random) {
  var data = {
    properties: {
      title: title,
      inputs: {},
      outputs: {},
      shape: "rectangle",
      random: random
    }
  };

  return setInAndOutAttribute({ data, nbInputs: 1, nbOutputs: 1 });
}

function dragHandler(draggableOperators, flowchartElement, container) {
  draggableOperators.draggable({
    cursor: "move",
    opacity: 0.7,

    helper: "clone",
    appendTo: "body",
    zIndex: 1000,

    helper: function(e) {
      var $this = $(this);
      var data = getOperatorData($this);
      console.log("operatorDataSource", data);
      //This is where the operatorData is passed into the flowchart function
      return flowchartElement.flowchart("getOperatorElement", data);
    },
    stop: function(e, ui) {
      console.log("!!!!!!!!!!!!!!");
      console.log(e);
      console.log("!!!!!!!!!!!!!!");
      var $this = $(this);
      var elOffset = ui.offset;
      // console.log(ui.offset);
      var containerOffset = container.offset();
      var withinContainer =
        elOffset.left > containerOffset.left &&
        elOffset.top > containerOffset.top &&
        elOffset.left < containerOffset.left + container.width() &&
        elOffset.top < containerOffset.top + container.height();
      // console.log(containerOffset);
      if (withinContainer) {
        var flowchartOffset = flowchartElement.offset();

        var relativeLeft = elOffset.left - flowchartOffset.left;
        // console.log(flowchartOffset.left);

        // console.log(relativeLeft);
        var relativeTop = elOffset.top - flowchartOffset.top;
        // console.log("flowchartOffset.top", flowchartOffset.top);
        // console.log(relativeTop);
        const objectId = ObjectID().str;

        var positionRatio = flowchartElement.flowchart("getPositionRatio");
        relativeLeft /= positionRatio;
        relativeTop /= positionRatio;

        var data = getOperatorData($this);
        data.left = relativeLeft;
        data.top = relativeTop;
        data.properties.objectId = objectId;

        console.log("Emitting event: nodeCreated with objectId: ", objectId);
        const nodeCreated = new Event("nodeCreated", { objectId });
        window.dispatchEvent(nodeCreated);

        // console.log(relativeLeft, relativeTop);

        //This function comes from the library
        flowchartElement.flowchart("addOperator", data);

        if (data.properties.func == "decider") {
          var approve = createApproveDeleteOperator(
            "Approve",
            data.properties.random
          );
          var reject = createApproveDeleteOperator(
            "Reject",
            data.properties.random
          );
          approve.left = relativeLeft - 120;
          approve.top = relativeTop + 100;
          reject.left = relativeLeft + 140;
          reject.top = approve.top;
          flowchartElement.flowchart("addOperator", approve);
          flowchartElement.flowchart("addOperator", reject);
        }
      }
    }
  });
}

$(document).ready(function() {
  var $flowchart = $("#example");
  var $element = document.querySelector("#example");
  var $container = $flowchart.parent();
  var data = {};
  var $draggableOperators = $(".draggable_operator");

  initializeFlowChart($flowchart, data);
  panzoomHandler($flowchart, $element, $container);
  deleteOperatorHandler($flowchart);
  dragHandler($draggableOperators, $flowchart, $container);
  // Apply the plugin on a standard, empty div...

  //This is where operatorData is retrieved
});
