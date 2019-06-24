// var $ = require('../node_modules/jquery/dist/jquery')

//The problem:the connector screw the input of data into input field
//Arrow and line algorithm is at _drawLink function at line 483
import RefactoredFunctions from "./jquery.refactor";

$(function() {
  // the widget definition, where "custom" is the namespace,
  // "colorize" the widget name
  $.widget("flowchart.flowchart", {
    // default options
    options: {
      canUserEditLinks: true,
      canUserMoveOperators: true,
      data: {},
      distanceFromArrow: 3,
      defaultOperatorClass: "flowchart-default-operator",
      defaultLinkColor: "pink",
      defaultSelectedLinkColor: "black",
      linkWidth: 10,
      grid: 20,
      multipleLinksOnOutput: false,
      multipleLinksOnInput: false,
      linkVerticalDecal: 0,
      onOperatorSelect: function(operatorId) {
        return true;
      },
      onOperatorUnselect: function() {
        return true;
      },
      onOperatorMouseOver: function(operatorId) {
        return true;
      },
      onOperatorMouseOut: function(operatorId) {
        return true;
      },
      onLinkSelect: function(linkId) {
        return true;
      },
      onLinkUnselect: function() {
        return true;
      },
      onOperatorCreate: function(operatorId, operatorData, fullElement) {
        return true;
      },
      onLinkCreate: function(linkId, linkData) {
        return true;
      },
      onOperatorDelete: function(operatorId) {
        return true;
      },
      onLinkDelete: function(linkId, forced) {
        return true;
      },
      onOperatorMoved: function(operatorId, position) {},
      onAfterChange: function(changeType) {}
    },
    data: null,
    objs: null,
    maskNum: 0,
    linkNum: 0,
    operatorNum: 0,
    lastOutputConnectorClicked: null,
    selectedOperatorId: null,
    selectedLinkId: null,
    positionRatio: 1,
    globalId: null,

    // the constructor
    _create: function() {
      if (typeof document.__flowchartNumber == "undefined") {
        document.__flowchartNumber = 0;
      } else {
        document.__flowchartNumber++;
      }
      this.globalId = document.__flowchartNumber;
      this._unitVariables();

      this.element.addClass("flowchart-container");

      this.objs.layers.links = $('<svg class="flowchart-links-layer"></svg>');
      this.objs.layers.links.appendTo(this.element);

      this.objs.layers.operators = $(
        '<div class="flowchart-operators-layer unselectable"></div>'
      );
      this.objs.layers.operators.appendTo(this.element);

      this.objs.layers.temporaryLink = $(
        '<svg class="flowchart-temporary-link-layer"></svg>'
      );
      this.objs.layers.temporaryLink.appendTo(this.element);

      var shape = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      //The dotted line is created here which we saw during dragging the line
      RefactoredFunctions.setInitialShapeAttribute(shape, {
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "0",
        "stroke-width": "1",
        stroke: "black",
        fill: "none"
      });
      this.objs.layers.temporaryLink[0].appendChild(shape);

      //This.objs.temporary link now refers to the temporary guiding black line
      //this.objs.temporaryLink = shape;

      this.objs.temporaryLink = $(
        ".flowchart-temporary-link-layer line:last-child"
      )[0];

      this._initEvents();

      if (typeof this.options.data != "undefined") {
        this.setData(this.options.data);
      }
    },

    _unitVariables: function() {
      this.data = {
        operators: {},
        links: {}
      };
      this.objs = {
        layers: {
          operators: null,
          temporaryLink: null,
          links: null
        },
        linksContext: null,
        temporaryLink: null
      };
    },

    _initEvents: function() {
      var self = this;

      //Customised listener

      //self.data.operators is the data of whole diagram

      //IF the flow chart title is double clicked, then the input will be visible
      this.objs.layers.operators.on(
        "dblclick",
        ".flowchart-span-title",
        function(e) {
          //Find nearest input field and remove the input-invisible class
          $(e.target)
            .next()
            .show();
          $(e.target).hide();
        }
      );

      this.objs.layers.operators.on(
        "dblclick",
        ".input-inside-operator",
        function(e) {
          //Find nearest input field and remove the input-invisible class
          if (e.target.value || /^\s*$/.test(e.target.vale)) {
            console.log("enter key is pressed");
            $(e.target)
              .prev()
              .html($(e.target).val());
          } else {
            $(e.target)
              .prev()
              .html("Start");
          }
          $(e.target)
            .prev()
            .show();
          $(e.target).hide();
        }
      );

      this.objs.layers.operators.on(
        "keypress",
        ".input-inside-operator",
        function(e) {
          if (e.which == 13) {
            console.log(e.target.value);
            console.log(!/^\s*$/.test(e.target.vale));
            if (e.target.value || /^\s*$/.test(e.target.vale)) {
              console.log("enter key is pressed");
              $(e.target)
                .prev()
                .html($(e.target).val());
            } else {
              $(e.target)
                .prev()
                .html("Start");
            }

            var operator_id = $(e.target)
              .parent()
              .parent()
              .parent()
              .parent()
              .parent()
              .data("operator_id");
            console.log("=============== 207");
            console.log(operator_id);

            var newOperatorData = self.data.operators;
            newOperatorData[operator_id].properties.title = $(e.target).val();
            self.data.operators = newOperatorData;
            console.log("=============== 213");
            console.log(self.data.operators);

            $(e.target).hide();
            $(e.target)
              .prev()
              .show();
          }
        }
      );

      //End of customised listener
      this.element.dblclick(function(e) {
        console.log("=============== 226");
        console.log($(e.target).attr("class"));
        if ($(e.target).attr("class") == "flowchart-links-layer") {
          let firstLine = $(".flowchart-temporary-link-layer line:first-child");
          let x1 = firstLine.attr("x1");
          let y1 = firstLine.attr("y1");
          firstLine[0].setAttribute("x2", x1);
          firstLine[0].setAttribute("y2", y1);
          $(".flowchart-temporary-link-layer").html(firstLine);
          self.objs.temporaryLink = $(
            ".flowchart-temporary-link-layer line:last-child"
          )[0];
          self.lastOutputConnectorClicked = null;
        }
      });

      this.element.mousemove(function(e) {
        //console.log(e);
        var $this = $(this);
        var offset = $this.offset();
        // console.log(
        //   (e.pageX - offset.left) / self.positionRatio,
        //   (e.pageY - offset.top) / self.positionRatio
        // );
        self._mousemove(
          (e.pageX - offset.left) / self.positionRatio,
          (e.pageY - offset.top) / self.positionRatio,
          e
        );
      });

      this.element.click(function(e) {
        // console.log($(e.target).attr("class"));
        var $this = $(this);
        // console.log("== @@@@@@@@@@@  ================");
        // console.log(self.data)
        // console.log(self.data.operators)
        // const clickedOperatorId = $(this).data.apply("operator_id");
        // console.log(self.data.operators[clickedOperatorId].properties.objectId);
        // const objId =
        //   self.data.operators[clickedOperatorId].properties.objectId;
        // console.log("Emitting event: nodeClicked with objectId: ", objId);
        // const nodeClicked = new Event("nodeClicked", { objId });
        // window.dispatchEvent(nodeClicked);

        // console.log("...................");
        // console.log(self.data.links);
        // console.log("== @@@@@@@@@@@  ================");
        var offset = $this.offset();
        // console.log("this.data.operators", self.data.operators);
        // console.log("this.data.links", self.data.links);
        self._click(
          (e.pageX - offset.left) / self.positionRatio,
          (e.pageY - offset.top) / self.positionRatio,
          e
        );
      });

      this.objs.layers.operators.on(
        "pointerdown mousedown touchstart",
        ".flowchart-operator",
        function(e) {
          e.stopImmediatePropagation();
        }
      );

      this.objs.layers.operators.on("click", ".flowchart-operator", function(
        e
      ) {
        console.log(
          "connector",
          $(e.target).closest(".flowchart-operator-connector")
        );
        if ($(e.target).closest(".flowchart-operator-connector").length == 0) {
          self.selectOperator($(this).data("operator_id"));
          console.log("Newly created operator", $(this).data("operator_id"));
        }
      });

      //When the connector is clicked and ready to connect
      this.objs.layers.operators.on(
        "click",
        ".flowchart-operator-connector",
        function() {
          console.log("Connector is now clicked!");
          var $this = $(this);
          console.log($this);
          if (self.options.canUserEditLinks) {
            //Where is self._connectorClicked
            self._connectorClicked(
              $this.closest(".flowchart-operator").data("operator_id"),
              $this.data("connector"),
              $this.data("sub_connector"),
              $this
                .closest(".flowchart-operator-connector-set")
                .data("connector_type")
            );
          }
        }
      );

      //End of the connector is clicked and ready to connect

      // this.objs.layers.links.on(
      //   "mousedown touchstart",
      //   ".flowchart-link",
      //   function(e) {
      //     e.stopImmediatePropagation();
      //   }
      // );

      this.objs.layers.links.on(
        "mouseover dblclick",
        ".flowchart-link",
        function(e) {
          console.log(self.selectedLinkId);
          self._connecterMouseOver($(this).data("link_id"));
          self.selectLink($(this).data("link_id"));
        }
      );

      // this.objs.layers.links.on("click", ".flowchart-link", function(e) {
      //   console.log("linkId", $(this).data("link_id"));
      //   self.selectLink($(this).data("link_id"));
      // });

      this.objs.layers.operators.on(
        "mouseover",
        ".flowchart-operator",
        function(e) {
          console.log($(this));
          self._operatorMouseOver($(this).data("operator_id"));
          // console.log("mouseover", $(this).data("operator_id"));
        }
      );

      this.objs.layers.operators.on("mouseout", ".flowchart-operator", function(
        e
      ) {
        // console.log("........................ 350")
        // console.log(e)
        // console.log("........................ 350")
        self._operatorMouseOut($(this).data("operator_id"));
      });
    },

    //Entry point of the program
    setData: function(data) {
      RefactoredFunctions.setData(data, this);
    },

    addLink: function(linkData) {
      RefactoredFunctions.addLink(linkData, this);
    },

    createLink: function(linkId, linkDataOriginal) {
      RefactoredFunctions.createLink(linkId, linkDataOriginal, this);
    },

    _autoCreateSubConnector: function(
      operator,
      connector,
      connectorType,
      subConnector
    ) {
      var connectorInfos = this.data.operators[operator].properties[
        connectorType
      ][connector];
      if (connectorInfos.multiple) {
        var fromFullElement = this.data.operators[operator].internal.els;
        console.log("fromFullElement", fromFullElement);
        var nbFromConnectors = this.data.operators[operator].internal.els
          .connectors[connector].length;
        console.log("nbFromConnectors", nbFromConnectors);
        for (var i = nbFromConnectors; i < subConnector + 2; i++) {
          this._createSubConnector(connector, connectorInfos, fromFullElement);
        }
      }
    },

    redrawLinksLayer: function() {
      this._clearLinksLayer();
      for (var linkId in this.data.links) {
        if (this.data.links.hasOwnProperty(linkId)) {
          this._drawLink(linkId);
        }
      }
    },

    _clearLinksLayer: function() {
      this.objs.layers.links.empty();
      this.objs.layers.operators
        .find(".flowchart-operator-connector-small-arrow")
        .css("border-left-color", "transparent");
    },

    _clearOperatorsLayer: function() {
      this.objs.layers.operators.empty();
    },

    //Get the positon of the connector clicked
    getConnectorPosition: function(operatorId, connectorId, subConnector) {
      return RefactoredFunctions.getConnectorPosition(
        operatorId,
        connectorId,
        subConnector,
        this
      );
    },

    getLinkMainColor: function(linkId) {
      var color = this.options.defaultLinkColor;
      var linkData = this.data.links[linkId];
      if (typeof linkData.color != "undefined") {
        color = linkData.color;
      }
      return color;
    },

    setLinkMainColor: function(linkId, color) {
      this.data.links[linkId].color = color;
      this.callbackEvent("afterChange", ["link_change_main_color"]);
    },

    //The svg and path is CREATED here in this function, noted that created only , the position is not set yet
    _drawLink: function(linkId) {
      RefactoredFunctions._drawLink(linkId, this);
    },

    _getSubConnectors: function(linkData) {
      var fromSubConnector = 0;
      if (typeof linkData.fromSubConnector != "undefined") {
        fromSubConnector = linkData.fromSubConnector;
      }

      var toSubConnector = 0;
      if (typeof linkData.toSubConnector != "undefined") {
        toSubConnector = linkData.toSubConnector;
      }

      return [fromSubConnector, toSubConnector];
    },

    //Setting the x and y attribute of the shape created in _drawlink
    _refreshLinkPositions: function(linkId) {
      RefactoredFunctions._refreshLinkPositions(linkId, this);
    },

    getOperatorCompleteData: function(operatorData) {
      return RefactoredFunctions.getOperatorCompleteData(operatorData, this);
    },

    //this depends upon getOperatorComplete data to generate html element
    _getOperatorFullElement: function(operatorData) {
      return RefactoredFunctions._getOperatorFullElement(operatorData, this);
    },

    //Create connector the triangle  shape
    _createSubConnector: function(
      connectorKey,
      connectorInfos,
      fullElement,
      connectorType,
      bottomPadding,
      func
    ) {
      var $operator_connector_set = fullElement.connectorSets[connectorKey];

      var subConnector = fullElement.connectors[connectorKey].length;

      var $operator_connector = $(
        '<div class="flowchart-operator-connector"></div>'
      );

      if (bottomPadding && func != "decider") {
        $operator_connector = $(
          '<div class="flowchart-operator-connector" style="bottom:20px"></div>'
        );
      }

      $operator_connector.appendTo($operator_connector_set);
      $operator_connector.data("connector", connectorKey);
      $operator_connector.data("sub_connector", subConnector);

      var $operator_connector_arrow = $(
        '<div class="flowchart-operator-connector-arrow"></div>'
      );

      $operator_connector_arrow.appendTo($operator_connector);

      //Operator connector arrow
      var $operator_connector_small_arrow = $(
        '<div class="flowchart-operator-connector-small-arrow" style="position:relative"></div>'
      );

      if (connectorType == "inputs") {
        $operator_connector_small_arrow = $(
          '<div class="flowchart-operator-connector-small-arrow" style="position:relative"></div>'
        );
      }

      $operator_connector_small_arrow.appendTo($operator_connector_arrow);

      fullElement.connectors[connectorKey].push($operator_connector);
      fullElement.connectorArrows[connectorKey].push($operator_connector_arrow);
      fullElement.connectorSmallArrows[connectorKey].push(
        $operator_connector_small_arrow
      );
    },

    getOperatorElement: function(operatorData) {
      var fullElement = this._getOperatorFullElement(operatorData);
      return fullElement.operator;
    },

    //Adding operator happens here when you drop a div at the canvas
    addOperator: function(operatorData) {
      if (
        RefactoredFunctions.createOperator(
          RefactoredFunctions.addOperator({
            operatorData: operatorData,
            self: this
          }),
          operatorData
        )
      ) {
        RefactoredFunctions.linkMotherToApproveAndReject(
          RefactoredFunctions.connectRejectAndApproveWithMother(
            operatorData,
            this
          )
        );
      }
    },

    createOperator: function(operatorId, operatorData) {
      RefactoredFunctions.createOperator(operatorId, operatorData, this);
    },

    //This is the callback function when connector is clicked

    _connectorClicked: function(
      operator,
      connector,
      subConnector,
      connectorCategory
    ) {
      if (connectorCategory == "outputs") {
        var d = new Date();
        // var currentTime = d.getTime();
        this.lastOutputConnectorClicked = {
          operator: operator,
          connector: connector,
          subConnector: subConnector
        };

        // console.log(
        //   "this.lastOutputConnectorClicked",
        //   this.lastOutputConnectorClicked
        // );

        this.objs.layers.temporaryLink.show();

        // console.log(
        //   "this.objs.layers.temporaryLink",
        //   this.objs.layers.temporaryLink
        // );

        var position = this.getConnectorPosition(
          operator,
          connector,
          subConnector
        );

        // console.log("position", position);

        var x = position.x + position.width;
        var y = position.y;

        // console.log("x", x);
        // console.log("y", y);

        //Where is temporaryLink; This set the starting point of the temporary link
        this.objs.temporaryLink.setAttribute("x1", x.toString());
        this.objs.temporaryLink.setAttribute("y1", y.toString());

        //Where is mousemove? Setting the initial position of the hint line first
        this._mousemove(x, y);
      }
      if (
        //Check if input connector is pressed and check if output connector is clicked beforehand
        connectorCategory == "inputs" &&
        this.lastOutputConnectorClicked != null
      ) {
        // console.log("connectorCategory", connectorCategory);
        // console.log(
        //   "this.lastOutputConnectorClicked",
        //   this.lastOutputConnectorClicked
        // );
        var linkData = {
          fromOperator: this.lastOutputConnectorClicked.operator,
          fromConnector: this.lastOutputConnectorClicked.connector,
          fromSubConnector: this.lastOutputConnectorClicked.subConnector,
          toOperator: operator,
          toConnector: connector,
          toSubConnector: subConnector
        };

        // console.log("linkData", linkData);

        // console.log(linkData);

        //Linkdata specify which output of which operator is connected to which input of which operator
        this._unsetTemporaryLink();
        this.addLink(linkData);
      }
    },

    _unsetTemporaryLink: function() {
      this.lastOutputConnectorClicked = null;
      this.objs.layers.temporaryLink.hide();
      //Remove all the added line except for the 1st one
      let firstLine = $(".flowchart-temporary-link-layer line:first-child");
      let x1 = firstLine.attr("x1");
      let y1 = firstLine.attr("y1");
      firstLine[0].setAttribute("x2", x1);
      firstLine[0].setAttribute("y2", y1);
      $(".flowchart-temporary-link-layer").html(
        $(".flowchart-temporary-link-layer line:first-child")
      );

      this.objs.temporaryLink = $(
        ".flowchart-temporary-link-layer line:last-child"
      )[0];
    },

    _mousemove: function(x, y, e) {
      //Update the length of hint length
      if (this.lastOutputConnectorClicked != null) {
        //console.log("this.objs.temporaryLink", this.objs.temporaryLink);
        this.objs.temporaryLink.setAttribute("x2", x);
        this.objs.temporaryLink.setAttribute("y2", y);
      }
    },

    _click: function(x, y, e) {
      var $target = $(e.target);
      var $flowchart_temporary_link_layer = $(
        ".flowchart-temporary-link-layer"
      );
      var lastLineDrawn = $(".flowchart-temporary-link-layer line:last-child");
      var nextLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      var x1 = lastLineDrawn.attr("x1");
      var y1 = lastLineDrawn.attr("y1");
      var x2 = lastLineDrawn.attr("x2");
      var y2 = lastLineDrawn.attr("y2");
      if (this.lastOutputConnectorClicked != null) {
        console.log(x1);
        console.log(x);
        console.log(x - x1);
        // isStraightLine = x - x1 < 0 ? -(x - x1) : x - x1;
        // isPerpendicular = y - y1 < 0 ? -(y - y1) : y - y1;
        //What to do when a connector is clicked and the temporary link is drag ann CLICKED on the svg of the flowchart
        //if (isStraightLine < 5 || isPerpendicular < 5) {
        this.objs.temporaryLink.setAttribute("x2", x);
        this.objs.temporaryLink.setAttribute("y2", y);

        if ($target[0].tagName == "svg") {
          nextLine.setAttribute("x1", x2);
          nextLine.setAttribute("y1", y2);
          nextLine.setAttribute("x2", x2);
          nextLine.setAttribute("y2", y2);
          nextLine.setAttribute("stroke", "black");
          nextLine.setAttribute("fill", "none");
          $flowchart_temporary_link_layer.append(nextLine);
          this.objs.temporaryLink = $(
            ".flowchart-temporary-link-layer line:last-child"
          )[0];
          console.log("Time to fight lo");
        }
        //}
      }
      // if ($target.closest(".flowchart-operator-connector").length == 0 ) {
      //   this._unsetTemporaryLink();
      // }

      if ($target.closest(".flowchart-operator").length == 0) {
        this.unselectOperator();
      }

      // if ($target.closest(".flowchart-link").length == 0) {
      //   this.unselectLink();
      // }
    },

    _removeSelectedClassOperators: function() {
      this.objs.layers.operators
        .find(".flowchart-operator")
        .removeClass("selected");
    },

    unselectOperator: function() {
      if (this.selectedOperatorId != null) {
        if (!this.callbackEvent("operatorUnselect", [])) {
          return;
        }
        this._removeSelectedClassOperators();
        this.selectedOperatorId = null;
      }
    },

    _addSelectedClass: function(operatorId) {
      this.data.operators[operatorId].internal.els.operator.addClass(
        "selected"
      );
    },

    callbackEvent: function(name, params) {
      var cbName = "on" + name.charAt(0).toUpperCase() + name.slice(1);
      var ret = this.options[cbName].apply(this, params);
      if (ret !== false) {
        var returnHash = { result: ret };
        this.element.trigger(name, params.concat([returnHash]));
        ret = returnHash["result"];
      }
      return ret;
    },

    selectOperator: function(operatorId) {
      const objId = this.data.operators[operatorId].properties.objectId;
      console.log("Emitting event: nodeClicked with objectId: ", objId);
      const nodeClicked = new Event("nodeClicked", { objId });
      window.dispatchEvent(nodeClicked);
      this.selectedLinkId = null;
      $(`.flowchart-link line`).each(function() {
        $(this).attr("stroke", "black");
      });
      if (!this.callbackEvent("operatorSelect", [operatorId])) {
        return;
      }
      this.unselectLink();
      this._removeSelectedClassOperators();
      this._addSelectedClass(operatorId);
      this.selectedOperatorId = operatorId;
    },

    addClassOperator: function(operatorId, className) {
      this.data.operators[operatorId].internal.els.operator.addClass(className);
    },

    removeClassOperator: function(operatorId, className) {
      this.data.operators[operatorId].internal.els.operator.removeClass(
        className
      );
    },

    removeClassOperators: function(className) {
      console.log("removeClass", className);
      this.objs.layers.operators
        .find(".flowchart-operator")
        .removeClass(className);
    },

    _addHoverClassOperator: function(operatorId) {
      this.data.operators[operatorId].internal.els.operator.addClass("hover");
    },

    _removeHoverClassOperators: function() {
      this.objs.layers.operators
        .find(".flowchart-operator")
        .removeClass("hover");
    },

    _operatorMouseOver: function(operatorId) {
      if (!this.callbackEvent("operatorMouseOver", [operatorId])) {
        return;
      }
      this._addHoverClassOperator(operatorId);
    },

    _operatorMouseOut: function(operatorId) {
      if (!this.callbackEvent("operatorMouseOut", [operatorId])) {
        return;
      }
      this._removeHoverClassOperators();
    },

    getSelectedOperatorId: function() {
      return this.selectedOperatorId;
    },

    getSelectedLinkId: function() {
      return this.selectedLinkId;
    },

    // Found here : http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    _shadeColor: function(color, percent) {
      var f = parseInt(color.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = (f >> 8) & 0x00ff,
        B = f & 0x0000ff;
      return (
        "#" +
        (
          0x1000000 +
          (Math.round((t - R) * p) + R) * 0x10000 +
          (Math.round((t - G) * p) + G) * 0x100 +
          (Math.round((t - B) * p) + B)
        )
          .toString(16)
          .slice(1)
      );
    },

    //Colorize the link
    colorizeLink: function(linkId, color) {
      var linkData = this.data.links[linkId];
    },

    uncolorizeLink: function(linkId) {
      this.colorizeLink(linkId, this.getLinkMainColor(linkId));
    },

    _connecterMouseOver: function(linkId) {
      if (this.selectedLinkId != linkId) {
        this.colorizeLink(
          linkId,
          this._shadeColor(this.getLinkMainColor(linkId), -0.4)
        );
      }
    },

    _connecterMouseOut: function(linkId) {
      if (this.selectedLinkId != linkId) {
        this.uncolorizeLink(linkId);
      }
    },

    unselectLink: function() {
      RefactoredFunctions.unselectLink(this);
    },

    selectLink: function(linkId) {
      if (RefactoredFunctions.selectLink(linkId, this)) {
        $(`.flowchart-link line`).each(function() {
          $(this).attr("stroke", "black");
        });
        $(`.flowchart-link[data-link_id=${linkId}] line`).each(function() {
          $(this).attr("stroke", "red");
        });
      }
    },

    deleteOperator: function(operatorId) {
      this._deleteOperator(operatorId, false);
    },

    _deleteOperator: function(operatorId, replace) {
      RefactoredFunctions._deleteOperator(operatorId, replace, this);
    },

    deleteLink: function(linkId) {
      RefactoredFunctions.deleteLink(linkId, this);
    },

    _deleteLink: function(linkId, forced) {
      RefactoredFunctions._deleteLink(linkId, forced, this);
    },

    _cleanMultipleConnectors: function(operator, connector, linkFromTo) {
      RefactoredFunctions._cleanMultipleConnectors(
        operator,
        connector,
        linkFromTo,
        this
      );
    },

    deleteSelected: function() {
      RefactoredFunctions.deleteSelected(this);
    },

    setPositionRatio: function(positionRatio) {
      this.positionRatio = positionRatio;
    },

    getPositionRatio: function() {
      return this.positionRatio;
    },

    getData: function() {
      RefactoredFunctions.getData(self);
    },

    setOperatorTitle: function(operatorId, title) {
      RefactoredFunctions.setOperatorTitle(operatorId, title, this);
    },

    getOperatorTitle: function(operatorId) {
      return this.data.operators[operatorId].internal.properties.title;
    },

    setOperatorData: function(operatorId, operatorData) {
      RefactoredFunctions.setOperatorData(operatorId, operatorData, self);
    },

    doesOperatorExists: function(operatorId) {
      return typeof this.data.operators[operatorId] != "undefined";
    },

    getOperatorData: function(operatorId) {
      var data = $.extend(true, {}, this.data.operators[operatorId]);
      delete data.internal;
      return data;
    },

    getOperatorFullProperties: function(operatorData) {
      if (typeof operatorData.type != "undefined") {
        var typeProperties = this.data.operatorTypes[operatorData.type];
        var operatorProperties = {};
        if (typeof operatorData.properties != "undefined") {
          operatorProperties = operatorData.properties;
        }
        return $.extend({}, typeProperties, operatorProperties);
      } else {
        return operatorData.properties;
      }
    },

    _refreshInternalProperties: function(operatorData) {
      operatorData.internal.properties = this.getOperatorFullProperties(
        operatorData
      );
    }
  });
});
