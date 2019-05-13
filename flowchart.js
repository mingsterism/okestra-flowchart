import myEmitter from "./Emitter";
// var $ = require("./node_modules/jquery/dist/jquery");
// var panzoom = require("jquery.panzoom");

$(document).ready(function() {
  //Hooking event emitter listener
  myEmitter.on("operatorChanged", operators => {
    console.log("Operators from event handler", operators);
    //Update the data in mongoDB
  });

  myEmitter.on("connectorChanged", connectors => {
    console.log("Draw link");
    console.log(connectors);
    const getOperatorId = (operatorNum, operatorsObj) => {
      console.log("@@@@@@@@@@@@@@@@@@");
      console.log(operatorsObj);
      return operatorsObj[operatorNum].properties.objectId;
    };
    const dataLinkages = [];
    console.log(Object.entries(connectors.links));
    const linkConnectors = Object.entries(connectors.links);

    linkConnectors.map(op => {
      console.log("@@@@@@@  1111    @@@@@@@@@@@");
      console.log(op["1"]);
      const id = getOperatorId(op["1"].fromOperator, connectors.operators);
      const toId = getOperatorId(op["1"].toOperator, connectors.operators);
      const resp = {
        id,
        toId
      };
      dataLinkages.push(resp);
    });
    console.log("Connectors from event handler", connectors);
    console.log("PAYLOAD: ", dataLinkages);
    //Update the data in mongoDB
  });

  var $flowchart = $("#example");
  // console.log($flowchart, "===============");
  // console.log($flowchart.flowchart);
  var $container = $flowchart.parent();

  const cx = $flowchart.width() / 2;
  const cy = $flowchart.height() / 2;

  // Panzoom initialization...
  // just grab a DOM element
  const element = document.querySelector("#example");
  // console.log(element, '=========')
  // And pass it to panzoom

  panzoom(element);

  $flowchart.panzoom();

  // // Centering panzoom
  $flowchart.panzoom(
    "pan",
    -cx + $container.width() / 2,
    -cy + $container.height() / 2
  );

  // Panzoom zoom handling...
  const possibleZooms = [0.5, 0.75, 1, 2, 3];
  let currentZoom = 2;
  $container.on("mousewheel.focal", e => {
    e.preventDefault();
    const delta =
      e.delta || e.originalEvent.wheelDelta || e.originalEvent.detail;
    const zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    currentZoom = Math.max(
      0,
      Math.min(possibleZooms.length - 1, currentZoom + (zoomOut * 2 - 1))
    );
    $flowchart.flowchart("setPositionRatio", possibleZooms[currentZoom]);
    $flowchart.panzoom("zoom", possibleZooms[currentZoom], {
      animate: false,
      focal: e
    });
  });

  const data = {};

  // Apply the plugin on a standard, empty div...
  $flowchart.flowchart({
    data,
    linkWidth: 5
  });

  $flowchart
    .parent()
    .siblings()
    .children(".delete_selected_button")
    .click(function() {
      //console.log("DELETING");
      $flowchart.flowchart("deleteSelected");
    });

  const $draggableOperators = $(".draggable_operator");

  // This is where operatorData is retrieved
  function getOperatorData($element) {
    const nbInputs = parseInt($element.data("nb-inputs"));
    const nbOutputs = parseInt($element.data("nb-outputs"));
    const shape = $element.data("shape");
    const func = $element.data("function");
    const r =
      func == "decider"
        ? Math.random()
            .toString(36)
            .substring(7)
        : null;
    const data = {
      properties: {
        title: $element.text(),
        inputs: {},
        outputs: {},
        shape,
        func,
        random: r,
        objectId: ""
      }
    };

    let i = 0;
    for (i = 0; i < nbInputs; i++) {
      data.properties.inputs[`input_${i}`] = {
        label: ""
      };
    }
    for (i = 0; i < nbOutputs; i++) {
      data.properties.outputs[`output_${i}`] = {
        label: ""
      };
    }

    return data;
  }

  function createApproveDeleteOperator(nbInputs, nbOutputs, title, random) {
    const data = {
      properties: {
        title,
        inputs: {},
        outputs: {},
        shape: "rectangle",
        random
      }
    };

    let i = 0;
    for (i = 0; i < nbInputs; i++) {
      data.properties.inputs[`input_${i}`] = {
        label: ""
      };
    }
    for (i = 0; i < nbOutputs; i++) {
      data.properties.outputs[`output_${i}`] = {
        label: ""
      };
    }

    return data;
  }

  const operatorId = 0;

  $draggableOperators.draggable({
    cursor: "move",
    opacity: 0.7,

    helper: "clone",
    appendTo: "body",
    zIndex: 1000,

    helper: function(e) {
      var $this = $(this);
      var data = getOperatorData($this);
      //console.log("operatorDataSource", data);
      //This is where the operatorData is passed into the flowchart function
      return $flowchart.flowchart("getOperatorElement", data);
    },
    stop: function(e, ui) {
      // console.log("!!!!!!!!!!!!!!");
      // console.log(e);
      // console.log("!!!!!!!!!!!!!!");
      var $this = $(this);
      var elOffset = ui.offset;
      // console.log(ui.offset);
      const containerOffset = $container.offset();
      // console.log(containerOffset);
      if (
        elOffset.left > containerOffset.left &&
        elOffset.top > containerOffset.top &&
        elOffset.left < containerOffset.left + $container.width() &&
        elOffset.top < containerOffset.top + $container.height()
      ) {
        const flowchartOffset = $flowchart.offset();

        let relativeLeft = elOffset.left - flowchartOffset.left;
        // console.log(flowchartOffset.left);

        // console.log(relativeLeft);
        let relativeTop = elOffset.top - flowchartOffset.top;
        // console.log("flowchartOffset.top", flowchartOffset.top);
        // console.log(relativeTop);

        const positionRatio = $flowchart.flowchart("getPositionRatio");
        relativeLeft /= positionRatio;
        relativeTop /= positionRatio;

        const data = getOperatorData($this);
        data.left = relativeLeft;
        data.top = relativeTop;
        // set object ID for each node
        data.properties.objectId = ObjectID().str;
        const objectId = data.properties.objectId;
        console.log("Emitting event: nodeCreated with objectId: ", objectId);
        const nodeCreated = new CustomEvent("nodeCreated", {
          detail: { objectId }
        });
        window.dispatchEvent(nodeCreated);

        // console.log(relativeLeft, relativeTop);

        //This function comes from the library
        $flowchart.flowchart("addOperator", data, myEmitter);

        if (data.properties.func == "decider") {
          const approve = createApproveDeleteOperator(
            1,
            1,
            "Approve",
            data.properties.random
          );
          const reject = createApproveDeleteOperator(
            1,
            1,
            "Reject",
            data.properties.random
          );
          approve.left = relativeLeft - 120;
          approve.top = relativeTop + 100;
          reject.left = relativeLeft + 140;
          reject.top = approve.top;
          $flowchart.flowchart("addOperator", approve, myEmitter);
          $flowchart.flowchart("addOperator", reject, myEmitter);
        }
      }
    }
  });
});
