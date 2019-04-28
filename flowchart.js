$(document).ready(function() {
  var $flowchart = $("#example");
  var $container = $flowchart.parent();

  var cx = $flowchart.width() / 2;
  var cy = $flowchart.height() / 2;

  // Panzoom initialization...
  $flowchart.panzoom();

  // Centering panzoom
  $flowchart.panzoom(
    "pan",
    -cx + $container.width() / 2,
    -cy + $container.height() / 2
  );

  // Panzoom zoom handling...
  var possibleZooms = [0.5, 0.75, 1, 2, 3];
  var currentZoom = 2;
  $container.on("mousewheel.focal", function(e) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta || e.originalEvent.detail;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
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

  var data = {};

  // Apply the plugin on a standard, empty div...
  $flowchart.flowchart({
    data: data,
    linkWidth: 5
  });

  $flowchart
    .parent()
    .siblings(".delete_selected_button")
    .click(function() {
      $flowchart.flowchart("deleteSelected");
    });

  var $draggableOperators = $(".draggable_operator");

  //This is where operatorData is retrieved
  function getOperatorData($element) {
    var nbInputs = parseInt($element.data("nb-inputs"));
    var nbOutputs = parseInt($element.data("nb-outputs"));
    var shape = $element.data("shape");
    var func = $element.data("function");
    let r =
      func == "decider"
        ? Math.random()
            .toString(36)
            .substring(7)
        : null;
    var data = {
      properties: {
        title: $element.text(),
        inputs: {},
        outputs: {},
        shape: shape,
        func: func,
        random: r
      }
    };

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

  function createApproveDeleteOperator(nbInputs, nbOutputs, title, random) {
    var data = {
      properties: {
        title: title,
        inputs: {},
        outputs: {},
        shape: "rectangle",
        random: random
      }
    };

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

  var operatorId = 0;

  $draggableOperators.draggable({
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
      return $flowchart.flowchart("getOperatorElement", data);
    },
    stop: function(e, ui) {
      console.log(e);
      var $this = $(this);
      var elOffset = ui.offset;
      console.log(ui.offset);
      var containerOffset = $container.offset();
      console.log(containerOffset);
      if (
        elOffset.left > containerOffset.left &&
        elOffset.top > containerOffset.top &&
        elOffset.left < containerOffset.left + $container.width() &&
        elOffset.top < containerOffset.top + $container.height()
      ) {
        var flowchartOffset = $flowchart.offset();

        var relativeLeft = elOffset.left - flowchartOffset.left;
        console.log(flowchartOffset.left);

        console.log(relativeLeft);
        var relativeTop = elOffset.top - flowchartOffset.top;
        console.log("flowchartOffset.top", flowchartOffset.top);
        console.log(relativeTop);

        var positionRatio = $flowchart.flowchart("getPositionRatio");
        relativeLeft /= positionRatio;
        relativeTop /= positionRatio;

        var data = getOperatorData($this);
        data.left = relativeLeft;
        data.top = relativeTop;

        console.log(relativeLeft, relativeTop);

        //This function comes from the library
        $flowchart.flowchart("addOperator", data);

        if (data.properties.func == "decider") {
          var approve = createApproveDeleteOperator(
            1,
            1,
            "Approve",
            data.properties.random
          );
          var reject = createApproveDeleteOperator(
            1,
            1,
            "Reject",
            data.properties.random
          );
          approve.left = relativeLeft - 120;
          approve.top = relativeTop + 100;
          reject.left = relativeLeft + 140;
          reject.top = approve.top;
          $flowchart.flowchart("addOperator", approve);
          $flowchart.flowchart("addOperator", reject);
        }
      }
    }
  });
});
