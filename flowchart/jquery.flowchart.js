// var $ = require('../node_modules/jquery/dist/jquery')


//The problem:the connector screw the input of data into input field
//Arrow and line algorithm is at _drawLink function at line 483
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

      console.log("Shape", shape);

      //The dotted line is created here which we saw during dragging the line
      shape.setAttribute("x1", "0");
      shape.setAttribute("y1", "0");
      shape.setAttribute("x2", "0");
      shape.setAttribute("y2", "0");
      shape.setAttribute("stroke-width", "1");
      shape.setAttribute("stroke", "black");
      shape.setAttribute("fill", "none");
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

            console.log(operator_id);

            var newOperatorData = self.data.operators;
            newOperatorData[operator_id].properties.title = $(e.target).val();
            self.data.operators = newOperatorData;
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
        console.log($(e.target).attr("class"));
        var $this = $(this);
        var offset = $this.offset();
        console.log("this.data.operators", self.data.operators);
        console.log("this.data.links", self.data.links);
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
          console.log("mouseover", $(this).data("operator_id"));
        }
      );

      this.objs.layers.operators.on("mouseout", ".flowchart-operator", function(
        e
      ) {
        self._operatorMouseOut($(this).data("operator_id"));
      });
    },

    //Entry point of the program
    setData: function(data) {
      console.log("setData", data.operators, data.operatorTypes);
      this._clearOperatorsLayer();
      this.data.operatorTypes = {};
      if (typeof data.operatorTypes != "undefined") {
        this.data.operatorTypes = data.operatorTypes;
      }

      this.data.operators = {};
      for (var operatorId in data.operators) {
        if (data.operators.hasOwnProperty(operatorId)) {
          this.createOperator(operatorId, data.operators[operatorId]);
        }
      }

      console.log("data.operators", data.operators);
      this.data.links = {};
      for (var linkId in data.links) {
        if (data.links.hasOwnProperty(linkId)) {
          this.createLink(linkId, data.links[linkId]);
        }
      }
      this.redrawLinksLayer();
    },

    addLink: function(linkData) {
      //Called upon linking when both input and output connector is clicked
      console.log("links", this.data.links);
      console.log(
        "link.this.data.operators from addLink function",
        this.data.operators
      );

      //This.data.links is a object storing linkData
      while (typeof this.data.links[this.linkNum] != "undefined") {
        this.linkNum++;
      }

      this.createLink(this.linkNum, linkData); //(0,linkData)
      return this.linkNum;
    },

    createLink: function(linkId, linkDataOriginal) {
      var linkData = $.extend(true, {}, linkDataOriginal);
      if (!this.callbackEvent("linkCreate", [linkId, linkData])) {
        return;
      }

      console.log("Line 339 of createLink", this.data.links);

      var subConnectors = this._getSubConnectors(linkData);
      //Getting the output connector involved
      var fromSubConnector = subConnectors[0];

      //Getting the input connector involved
      var toSubConnector = subConnectors[1];

      //Check if the connector is already connected, the old connection will be abolished,i.e. the old object will be removed
      //from the this.data.link object
      var multipleLinksOnOutput = this.options.multipleLinksOnOutput;
      var multipleLinksOnInput = this.options.multipleLinksOnInput;
      if (!multipleLinksOnOutput || !multipleLinksOnInput) {
        for (var linkId2 in this.data.links) {
          if (this.data.links.hasOwnProperty(linkId2)) {
            var currentLink = this.data.links[linkId2];

            var currentSubConnectors = this._getSubConnectors(currentLink);
            var currentFromSubConnector = currentSubConnectors[0];
            var currentToSubConnector = currentSubConnectors[1];

            if (
              !multipleLinksOnOutput &&
              currentLink.fromOperator == linkData.fromOperator &&
              currentLink.fromConnector == linkData.fromConnector &&
              currentFromSubConnector == fromSubConnector
            ) {
              this.deleteLink(linkId2);
              continue;
            }
            if (
              !multipleLinksOnInput &&
              currentLink.toOperator == linkData.toOperator &&
              currentLink.toConnector == linkData.toConnector &&
              currentToSubConnector == toSubConnector
            ) {
              this.deleteLink(linkId2);
            }
          }
        }
      }

      //new linkData is inserted into this.data.links
      this.data.links[linkId] = linkData;

      //Time to draw out svg and path line
      this._drawLink(linkId);

      this.callbackEvent("afterChange", ["link_create"]);
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
      var operatorData = this.data.operators[operatorId];
      var $connector =
        operatorData.internal.els.connectorArrows[connectorId][subConnector];

      var connectorOffset = $connector.offset();
      var elementOffset = this.element.offset();

      var x = (connectorOffset.left - elementOffset.left) / this.positionRatio;
      var width = parseInt($connector.css("border-top-width"));
      var y =
        (connectorOffset.top - elementOffset.top - 1) / this.positionRatio +
        parseInt($connector.css("border-left-width"));

      return { x: x, width: width, y: y };
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
      var linkData = this.data.links[linkId];
      if (typeof linkData.internal == "undefined") {
        linkData.internal = {};
      }
      linkData.internal.els = {};
      var fromOperatorId = linkData.fromOperator;
      var fromConnectorId = linkData.fromConnector;
      var toOperatorId = linkData.toOperator;
      var toConnectorId = linkData.toConnector;
      var subConnectors = this._getSubConnectors(linkData);
      var fromSubConnector = subConnectors[0];
      var toSubConnector = subConnectors[1];
      var color = this.getLinkMainColor(linkId);
      var fromOperator = this.data.operators[fromOperatorId];
      var toOperator = this.data.operators[toOperatorId];
      var fromSmallConnector =
        fromOperator.internal.els.connectorSmallArrows[fromConnectorId][
          fromSubConnector
        ];
      var toSmallConnector =
        toOperator.internal.els.connectorSmallArrows[toConnectorId][
          toSubConnector
        ];
      linkData.internal.els.fromSmallConnector = fromSmallConnector;
      linkData.internal.els.toSmallConnector = toSmallConnector;

      console.log("linkData.internal.els", linkData.internal.els);

      var overallGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      this.objs.layers.links[0].appendChild(overallGroup);

      var line1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      var line2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      var line3 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      var line4 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      var line5 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      linkData.internal.els.overallGroup = overallGroup;
      var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "flowchart-link");
      group.setAttribute("data-link_id", linkId);
      overallGroup.appendChild(group);
      linkData.internal.els.line1 = line1;
      linkData.internal.els.line2 = line2;
      linkData.internal.els.line3 = line3;
      linkData.internal.els.line4 = line4;
      linkData.internal.els.line5 = line5;
      group.appendChild(line1);
      group.appendChild(line2);
      group.appendChild(line3);
      group.appendChild(line4);
      group.appendChild(line5);
      this._refreshLinkPositions(linkId);
      this.uncolorizeLink(linkId);
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
      var linkData = this.data.links[linkId];

      var subConnectors = this._getSubConnectors(linkData);
      var fromSubConnector = subConnectors[0];
      var toSubConnector = subConnectors[1];

      var fromPosition = this.getConnectorPosition(
        linkData.fromOperator,
        linkData.fromConnector,
        fromSubConnector
      );
      var toPosition = this.getConnectorPosition(
        linkData.toOperator,
        linkData.toConnector,
        toSubConnector
      );

      //I use svg line to draw line <line></line>

      //x position of the output connector
      var fromX = fromPosition.x;
      var offsetFromX = fromPosition.width;

      //y position of output connector
      var fromY = fromPosition.y;

      //x position of input connector
      var toX = toPosition.x;

      //y position of input connector
      var toY = toPosition.y;

      var distanceFromArrow = this.options.distanceFromArrow;

      //Doing the math 1st
      var xdiff = toX - fromX < 0 ? -(toX - fromX) : toX - fromX;
      var ydiff = toY - fromY < 0 ? -(toY - fromY) : toY - fromY;

      console.log("xdiff", xdiff);
      console.log("ydiff", ydiff);

      console.log("xdiff", xdiff);
      var halfYdiff = ydiff / 2;
      var halfXdiff = xdiff / 2;

      if (toY - fromY < 62 && toY - fromY >= -20 && xdiff >= 100) {
        linkData.internal.els.line1.setAttribute("x1", fromX + offsetFromX);
        linkData.internal.els.line1.setAttribute("y1", fromY);
        linkData.internal.els.line1.setAttribute("x2", fromX + offsetFromX);
        linkData.internal.els.line1.setAttribute("y2", fromY + 80);
        linkData.internal.els.line1.setAttribute("stroke", "black");

        linkData.internal.els.line2.setAttribute("x1", fromX + offsetFromX);
        linkData.internal.els.line2.setAttribute("y1", fromY + 80);
        console.log(toX - fromX);
        linkData.internal.els.line2.setAttribute(
          "x2",
          toX + (toX - fromX) * 1.5
        );
        linkData.internal.els.line2.setAttribute("y2", fromY + 80);
        linkData.internal.els.line2.setAttribute("stroke", "black");

        linkData.internal.els.line3.setAttribute(
          "x1",
          toX + (toX - fromX) * 1.5
        );
        linkData.internal.els.line3.setAttribute("y1", fromY + 80);
        linkData.internal.els.line3.setAttribute(
          "x2",
          toX + (toX - fromX) * 1.5
        );
        linkData.internal.els.line3.setAttribute("y2", fromY - 40);
        linkData.internal.els.line3.setAttribute("stroke", "black");

        linkData.internal.els.line4.setAttribute(
          "x1",
          toX + (toX - fromX) * 1.5
        );
        linkData.internal.els.line4.setAttribute("y1", fromY - 40);
        linkData.internal.els.line4.setAttribute("x2", toX + offsetFromX);
        linkData.internal.els.line4.setAttribute("y2", fromY - 40);
        linkData.internal.els.line4.setAttribute("stroke", "black");

        linkData.internal.els.line5.setAttribute("x1", toX + offsetFromX);
        linkData.internal.els.line5.setAttribute("y1", fromY - 40);
        linkData.internal.els.line5.setAttribute("x2", toX + offsetFromX);
        linkData.internal.els.line5.setAttribute("y2", toY);
        linkData.internal.els.line5.setAttribute("stroke", "black");
      } else if (toY - fromY < 0 && xdiff != 0) {
        linkData.internal.els.line1.setAttribute("x1", fromX + offsetFromX);
        linkData.internal.els.line1.setAttribute("y1", fromY);
        linkData.internal.els.line1.setAttribute("x2", fromX + offsetFromX);
        linkData.internal.els.line1.setAttribute("y2", fromY + halfYdiff);
        linkData.internal.els.line1.setAttribute("stroke", "black");

        linkData.internal.els.line2.setAttribute("x1", fromX + offsetFromX);
        linkData.internal.els.line2.setAttribute("y1", fromY + halfYdiff);
        linkData.internal.els.line2.setAttribute(
          "x2",
          toX + offsetFromX + halfXdiff
        );
        linkData.internal.els.line2.setAttribute("y2", fromY + halfYdiff);
        linkData.internal.els.line2.setAttribute("stroke", "black");

        linkData.internal.els.line3.setAttribute(
          "x1",
          toX + offsetFromX + halfXdiff
        );
        linkData.internal.els.line3.setAttribute("y1", fromY + halfYdiff);
        linkData.internal.els.line3.setAttribute(
          "x2",
          toX + offsetFromX + halfXdiff
        );
        linkData.internal.els.line3.setAttribute("y2", toY - halfYdiff);
        linkData.internal.els.line3.setAttribute("stroke", "black");

        linkData.internal.els.line4.setAttribute(
          "x1",
          toX + offsetFromX + halfXdiff
        );
        linkData.internal.els.line4.setAttribute("y1", toY - halfYdiff);
        linkData.internal.els.line4.setAttribute("x2", toX + offsetFromX);
        linkData.internal.els.line4.setAttribute("y2", toY - halfYdiff);
        linkData.internal.els.line4.setAttribute("stroke", "black");

        linkData.internal.els.line5.setAttribute("x1", toX + offsetFromX);
        linkData.internal.els.line5.setAttribute("y1", toY);
        linkData.internal.els.line5.setAttribute("x2", toX + offsetFromX);
        linkData.internal.els.line5.setAttribute("y2", toY - halfYdiff);
        linkData.internal.els.line5.setAttribute("stroke", "black");
      } else if (xdiff == 0 && toY - fromY < 0) {
        linkData.internal.els.line1.setAttribute("x1", fromX + offsetFromX);
        linkData.internal.els.line1.setAttribute("y1", fromY);
        linkData.internal.els.line1.setAttribute("x2", fromX + offsetFromX);
        linkData.internal.els.line1.setAttribute("y2", fromY + halfYdiff);
        linkData.internal.els.line1.setAttribute("stroke", "black");

        linkData.internal.els.line2.setAttribute("x1", fromX + offsetFromX);
        linkData.internal.els.line2.setAttribute("y1", fromY + halfYdiff);
        linkData.internal.els.line2.setAttribute(
          "x2",
          fromX + offsetFromX + 200
        );
        linkData.internal.els.line2.setAttribute("y2", fromY + halfYdiff);
        linkData.internal.els.line2.setAttribute("stroke", "black");

        linkData.internal.els.line3.setAttribute(
          "x1",
          fromX + offsetFromX + 200
        );
        linkData.internal.els.line3.setAttribute("y1", fromY + halfYdiff);
        linkData.internal.els.line3.setAttribute(
          "x2",
          toX + offsetFromX + halfXdiff + 200
        );
        linkData.internal.els.line3.setAttribute("y2", toY - halfYdiff);
        linkData.internal.els.line3.setAttribute("stroke", "black");

        linkData.internal.els.line4.setAttribute(
          "x1",
          toX + offsetFromX + halfXdiff
        );
        linkData.internal.els.line4.setAttribute("y1", toY - halfYdiff);
        linkData.internal.els.line4.setAttribute(
          "x2",
          toX + offsetFromX + halfXdiff + 200
        );
        linkData.internal.els.line4.setAttribute("y2", toY - halfYdiff);
        linkData.internal.els.line4.setAttribute("stroke", "black");

        linkData.internal.els.line5.setAttribute("x1", toX + offsetFromX);
        linkData.internal.els.line5.setAttribute("y1", toY);
        linkData.internal.els.line5.setAttribute("x2", toX + offsetFromX);
        linkData.internal.els.line5.setAttribute("y2", toY - halfYdiff);
        linkData.internal.els.line5.setAttribute("stroke", "black");
      } else {
        linkData.internal.els.line1.setAttribute("x1", fromX + offsetFromX);
        linkData.internal.els.line1.setAttribute("y1", fromY);
        linkData.internal.els.line1.setAttribute("x2", fromX + offsetFromX);
        linkData.internal.els.line1.setAttribute("y2", fromY + halfYdiff);
        linkData.internal.els.line1.setAttribute("stroke", "black");

        linkData.internal.els.line2.setAttribute("x1", fromX + offsetFromX);
        linkData.internal.els.line2.setAttribute("y1", fromY + halfYdiff);
        linkData.internal.els.line2.setAttribute("x2", toX + offsetFromX);
        linkData.internal.els.line2.setAttribute("y2", toY - halfYdiff);
        linkData.internal.els.line2.setAttribute("stroke", "black");

        linkData.internal.els.line3.setAttribute("x1", toX + offsetFromX);
        linkData.internal.els.line3.setAttribute("y1", toY - halfYdiff);
        linkData.internal.els.line3.setAttribute("x2", toX + offsetFromX);
        linkData.internal.els.line3.setAttribute("y2", toY);
        linkData.internal.els.line3.setAttribute("stroke", "black");

        linkData.internal.els.line4.setAttribute("x1", 0);
        linkData.internal.els.line4.setAttribute("y1", 0);
        linkData.internal.els.line4.setAttribute("x2", 0);
        linkData.internal.els.line4.setAttribute("y2", 0);
        linkData.internal.els.line4.setAttribute("stroke", "black");

        linkData.internal.els.line5.setAttribute("x1", 0);
        linkData.internal.els.line5.setAttribute("y1", 0);
        linkData.internal.els.line5.setAttribute("x2", 0);
        linkData.internal.els.line5.setAttribute("y2", 0);
        linkData.internal.els.line5.setAttribute("stroke", "black");
      }
    },

    getOperatorCompleteData: function(operatorData) {
      if (typeof operatorData.internal == "undefined") {
        operatorData.internal = {};
      }
      this._refreshInternalProperties(operatorData);
      var infos = $.extend(true, {}, operatorData.internal.properties);

      console.log("infos.inputs", infos.inputs);

      for (var connectorId_i in infos.inputs) {
        if (infos.inputs.hasOwnProperty(connectorId_i)) {
          if (infos.inputs[connectorId_i] == null) {
            delete infos.inputs[connectorId_i];
          }
        }
      }

      for (var connectorId_o in infos.outputs) {
        if (infos.outputs.hasOwnProperty(connectorId_o)) {
          if (infos.outputs[connectorId_o] == null) {
            delete infos.outputs[connectorId_o];
          }
        }
      }

      if (typeof infos.class == "undefined") {
        infos.class = this.options.defaultOperatorClass;
      }
      return infos;
    },

    //this depends upon getOperatorComplete data to generate html element
    _getOperatorFullElement: function(operatorData) {
      var infos = this.getOperatorCompleteData(operatorData);

      console.log("infos", infos);

      if (infos.func == "decider") {
        console.log("Decider");
      }

      $operator_diamond_item_count = $('<div class="item_count"></div>');

      var $operator = $('<div class="flowchart-operator"></div>');
      $operator.addClass(infos.class);
      $operator.addClass(infos.shape);

      console.log("info.class", infos.class);

      $container = $('<div class="container"></div>');

      $container.appendTo($operator);

      $row = $('<div class="row"></div>');

      $row.appendTo($container);

      $icon = $("<div class='col-sm-2'></div>");

      $mailIcon = $(
        '<span class="glyphicon" style="color:black;font-size:30px">&#x2709;</span>'
      );

      $mailIcon.appendTo($icon);

      $icon.appendTo($row);

      $title = $("<div class='col-sm-10'></div>");

      $title.appendTo($row);

      //Creating an input to take in customised value on the user
      var $operator_input = $(
        '<input type="text" style="width:100%;display:none;height:90%" class="input-inside-operator"/>'
      );

      var $operator_title = $('<div class="flowchart-operator-title"></div>');

      var $operator_span_title = $(
        "<div class='flowchart-span-title'>" + infos.title + "</div>"
      );

      $operator_title.html($operator_span_title);
      $operator_title.appendTo($title);
      $operator_input.appendTo($operator_title);

      //Adding input with display on none
      $operator_title.addClass("centerText");

      var $operator_inputs_outputs = $(
        '<div class="flowchart-operator-inputs-outputs"></div>'
      );

      $operator_inputs_outputs.appendTo($operator);

      //Input div part
      var $operator_inputs = $('<div class="flowchart-operator-inputs"></div>');

      $operator_inputs.appendTo($operator_inputs_outputs);

      var $operator_outputs = $(
        '<div class="flowchart-operator-outputs"></div>'
      );
      $operator_outputs.appendTo($operator_inputs_outputs);

      var self = this;

      var connectorArrows = {};
      var connectorSmallArrows = {};
      var connectorSets = {};
      var connectors = {};

      var fullElement = {
        operator: $operator,
        title: $operator_title,
        connectorSets: connectorSets,
        connectors: connectors,
        connectorArrows: connectorArrows,
        connectorSmallArrows: connectorSmallArrows,
        func: infos.func
      };

      //Connector is created here
      function addConnector(
        connectorKey,
        connectorInfos,
        $operator_container,
        connectorType,
        bottomPadding,
        func
      ) {
        var $operator_connector_set = $(
          '<div class="flowchart-operator-connector-set"></div>'
        );

        if (connectorKey == "output_1" && func == "decider") {
          $operator_connector_set.css("height", 0);
        }

        $operator_connector_set.data("connector_type", connectorType);
        $operator_connector_set.appendTo($operator_container);

        connectorArrows[connectorKey] = [];
        connectorSmallArrows[connectorKey] = [];
        connectors[connectorKey] = [];
        connectorSets[connectorKey] = $operator_connector_set;

        self._createSubConnector(
          connectorKey,
          connectorInfos,
          fullElement,
          connectorType,
          bottomPadding,
          fullElement.func
        );
      }

      for (var key_i in infos.inputs) {
        if (infos.inputs.hasOwnProperty(key_i)) {
          var bottomPadding = false;
          if (Object.keys(infos.inputs).length == 2 && key_i == "input_0") {
            bottomPadding = true;
          }
          addConnector(
            key_i,
            infos.inputs[key_i],
            $operator_inputs,
            "inputs",
            bottomPadding
          );
        }
      }
      console.log("infos", infos.func);
      for (var key_o in infos.outputs) {
        if (infos.outputs.hasOwnProperty(key_o)) {
          var bottomPadding = false;
          if (Object.keys(infos.outputs).length == 2 && key_o == "output_0") {
            bottomPadding = true;
          }
          addConnector(
            key_o,
            infos.outputs[key_o],
            $operator_outputs,
            "outputs",
            bottomPadding,
            infos.func
          );
        }
      }

      return fullElement;
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
      while (typeof this.data.operators[this.operatorNum] != "undefined") {
        //Create the id of operator
        this.operatorNum++;
      }

      //Put the operatorData into the JSON object which is accessible through this.data.operators
      this.createOperator(this.operatorNum, operatorData);

      //Automatically popups of the Approve and Reject Operator
      if (operatorData.properties.title == "Reject") {
        let r = operatorData.properties.random;
        let approve, reject, mother, approveNum, rejectNum, motherNum;
        for (var key in this.data.operators) {
          if (
            this.data.operators[key].properties.random == r &&
            this.data.operators[key].properties.title == "Approve"
          ) {
            approve = this.data.operators[key];
            approveNum = key;
          }

          if (
            this.data.operators[key].properties.random == r &&
            this.data.operators[key].properties.title == "Reject"
          ) {
            reject = this.data.operators[key];
            rejectNum = key;
          }

          if (
            this.data.operators[key].properties.random == r &&
            this.data.operators[key].properties.title != "Approve" &&
            this.data.operators[key].properties.title != "Reject"
          ) {
            mother = this.data.operators[key];
            motherNum = key;
          }
        }

        //After i put the approve and reject operator onto the canvas, i create link to link them together
        var linkData1 = {
          fromOperator: motherNum,
          fromConnector: "output_0",
          fromSubConnector: 0,
          toOperator: approveNum,
          toConnector: "input_0",
          toSubConnector: 0
        };

        var linkData2 = {
          fromOperator: motherNum,
          fromConnector: "output_1",
          fromSubConnector: 0,
          toOperator: rejectNum,
          toConnector: "input_0",
          toSubConnector: 0
        };

        //Add Link object into JSON object that contains all the link which is called this.data.links
        this.addLink(linkData1);

        this.addLink(linkData2);
      }
      return this.operatorNum;
    },

    createOperator: function(operatorId, operatorData) {
      operatorData.internal = {};
      this._refreshInternalProperties(operatorData);

      var fullElement = this._getOperatorFullElement(operatorData);
      console.log("operatorData", operatorData);
      if (
        !this.callbackEvent("operatorCreate", [
          operatorId,
          operatorData,
          fullElement
        ])
      ) {
        return false;
      }

      var grid = this.options.grid;

      if (grid) {
        operatorData.top = Math.round(operatorData.top / grid) * grid;
        operatorData.left = Math.round(operatorData.left / grid) * grid;
      }

      console.log(operatorData.top);
      console.log(operatorData.left);

      fullElement.operator.appendTo(this.objs.layers.operators);
      fullElement.operator.css({
        position: "absolute",
        top: operatorData.top,
        left: operatorData.left
      });
      fullElement.operator.data("operator_id", operatorId);

      this.data.operators[operatorId] = operatorData;
      this.data.operators[operatorId].internal.els = fullElement;

      if (operatorId == this.selectedOperatorId) {
        this._addSelectedClass(operatorId);
      }

      var self = this;

      function operatorChangedPosition(operator_id, pos) {
        //We passed in the new position of the operator
        operatorData.top = pos.top;
        operatorData.left = pos.left;

        for (var linkId in self.data.links) {
          if (self.data.links.hasOwnProperty(linkId)) {
            var linkData = self.data.links[linkId];
            if (
              linkData.fromOperator == operator_id ||
              linkData.toOperator == operator_id
            ) {
              self._refreshLinkPositions(linkId);
            }
          }
        }
      }

      // Small fix has been added in order to manage eventual zoom
      // http://stackoverflow.com/questions/2930092/jquery-draggable-with-zoom-problem
      if (this.options.canUserMoveOperators) {
        var pointerX;
        var pointerY;
        fullElement.operator.draggable({
          containment: operatorData.internal.properties.uncontained
            ? false
            : this.element,
          handle: ".flowchart-operator-title",
          start: function(e, ui) {
            if (self.lastOutputConnectorClicked != null) {
              e.preventDefault();
              return;
            }
            var elementOffset = self.element.offset();
            pointerX =
              (e.pageX - elementOffset.left) / self.positionRatio -
              parseInt($(e.target).css("left"));
            pointerY =
              (e.pageY - elementOffset.top) / self.positionRatio -
              parseInt($(e.target).css("top"));
          },
          //Everytime the operator is dragged this callback will be called
          drag: function(e, ui) {
            if (self.options.grid) {
              var grid = self.options.grid;
              var elementOffset = self.element.offset();
              console.log(elementOffset);
              ui.position.left =
                Math.round(
                  ((e.pageX - elementOffset.left) / self.positionRatio -
                    pointerX) /
                    grid
                ) * grid;
              console.log("ui.position.left", ui.position.left);
              ui.position.top =
                Math.round(
                  ((e.pageY - elementOffset.top) / self.positionRatio -
                    pointerY) /
                    grid
                ) * grid;
              console.log(!operatorData.internal.properties.uncontained);
              if (!operatorData.internal.properties.uncontained) {
                const sizeW = parseInt($("#example").css("width"));
                const sizeH = parseInt($("#example").css("height"));
                const constantW = (19.5 / (sizeW / 100)) * sizeW;
                const constantH = (21 / (sizeH / 100)) * sizeH;
                console.log(sizeH);
                var $this = $(this);
                // ui.position.left = Math.min(
                //   Math.max(ui.position.left, 0),
                //   self.element.width() - $this.outerWidth()
                // );
                if (ui.position.left > constantW) {
                  ui.position.left = constantW;
                } else if (ui.position.left < 0) {
                  ui.position.left = 0;
                }

                if (ui.position.top < 0) {
                  ui.position.top = 0;
                } else if (ui.position.top > constantH) {
                  ui.position.top = constantH;
                }
                // ui.position.top = Math.min(
                //   Math.max(ui.position.top, 0),
                //   self.element.height() - $this.outerHeight()
                // );
              }

              ui.offset.left = Math.round(
                ui.position.left + elementOffset.left
              );
              ui.offset.top = Math.round(ui.position.top + elementOffset.top);
              fullElement.operator.css({
                left: ui.position.left,
                top: ui.position.top
              });
            }

            operatorChangedPosition($(this).data("operator_id"), ui.position);

            console.log("ui.position", ui.position);
          },
          stop: function(e, ui) {
            self._unsetTemporaryLink();
            var operatorId = $(this).data("operator_id");
            operatorChangedPosition(operatorId, ui.position);
            //Height auto causing shape deformed
            // fullElement.operator.css({
            //   height: "auto"
            // });

            self.callbackEvent("operatorMoved", [operatorId, ui.position]);
            self.callbackEvent("afterChange", ["operator_moved"]);
          }
        });
      }

      this.callbackEvent("afterChange", ["operator_create"]);
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

        console.log(
          "this.lastOutputConnectorClicked",
          this.lastOutputConnectorClicked
        );

        this.objs.layers.temporaryLink.show();

        console.log(
          "this.objs.layers.temporaryLink",
          this.objs.layers.temporaryLink
        );

        var position = this.getConnectorPosition(
          operator,
          connector,
          subConnector
        );

        console.log("position", position);

        var x = position.x + position.width;
        var y = position.y;

        console.log("x", x);
        console.log("y", y);

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
        console.log("connectorCategory", connectorCategory);
        console.log(
          "this.lastOutputConnectorClicked",
          this.lastOutputConnectorClicked
        );
        var linkData = {
          fromOperator: this.lastOutputConnectorClicked.operator,
          fromConnector: this.lastOutputConnectorClicked.connector,
          fromSubConnector: this.lastOutputConnectorClicked.subConnector,
          toOperator: operator,
          toConnector: connector,
          toSubConnector: subConnector
        };

        console.log("linkData", linkData);

        console.log(linkData);

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
      if (this.selectedLinkId != null) {
        if (!this.callbackEvent("linkUnselect", [])) {
          return;
        }
        this.selectedLinkId = null;
      }
    },

    selectLink: function(linkId) {
      this.unselectLink();
      if (!this.callbackEvent("linkSelect", [linkId])) {
        return;
      }
      this.unselectOperator();
      this.selectedLinkId = linkId;

      let toOperator = this.data.links[linkId].toOperator;
      let fromOperator = this.data.links[linkId].fromOperator;

      if (
        !this.data.operators[toOperator].properties.random ||
        !this.data.operators[fromOperator].properties.random
      ) {
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
      if (!this.callbackEvent("operatorDelete", [operatorId, replace])) {
        return false;
      }
      if (!replace) {
        for (var linkId in this.data.links) {
          if (this.data.links.hasOwnProperty(linkId)) {
            var currentLink = this.data.links[linkId];
            if (
              currentLink.fromOperator == operatorId ||
              currentLink.toOperator == operatorId
            ) {
              this._deleteLink(linkId, true);
            }
          }
        }
      }
      if (!replace && operatorId == this.selectedOperatorId) {
        this.unselectOperator();
      }
      this.data.operators[operatorId].internal.els.operator.remove();
      delete this.data.operators[operatorId];

      this.callbackEvent("afterChange", ["operator_delete"]);

      for (var key in this.data.links) {
        console.log(this.data.links);
        console.log(key);
        this._refreshLinkPositions(key);
      }
    },

    deleteLink: function(linkId) {
      let fromOperator = this.data.links[linkId].fromOperator;
      let toOperator = this.data.links[linkId].toOperator;
      if (
        !this.data.operators[fromOperator].properties.random ||
        !this.data.operators[toOperator].properties.random
      ) {
        this._deleteLink(linkId, false);
      }
    },

    _deleteLink: function(linkId, forced) {
      if (this.selectedLinkId == linkId) {
        this.unselectLink();
      }
      if (!this.callbackEvent("linkDelete", [linkId, forced])) {
        if (!forced) {
          return;
        }
      }
      this.colorizeLink(linkId, "transparent");
      var linkData = this.data.links[linkId];
      var fromOperator = linkData.fromOperator;
      var fromConnector = linkData.fromConnector;
      var toOperator = linkData.toOperator;
      var toConnector = linkData.toConnector;
      linkData.internal.els.overallGroup.remove();
      delete this.data.links[linkId];

      this._cleanMultipleConnectors(fromOperator, fromConnector, "from");
      this._cleanMultipleConnectors(toOperator, toConnector, "to");

      this.callbackEvent("afterChange", ["link_delete"]);
    },

    _cleanMultipleConnectors: function(operator, connector, linkFromTo) {
      if (
        !this.data.operators[operator].properties[
          linkFromTo == "from" ? "outputs" : "inputs"
        ][connector].multiple
      ) {
        return;
      }

      var maxI = -1;
      var fromToOperator = linkFromTo + "Operator";
      var fromToConnector = linkFromTo + "Connector";
      var fromToSubConnector = linkFromTo + "SubConnector";
      var els = this.data.operators[operator].internal.els;
      var subConnectors = els.connectors[connector];
      var nbSubConnectors = subConnectors.length;

      for (var linkId in this.data.links) {
        if (this.data.links.hasOwnProperty(linkId)) {
          var linkData = this.data.links[linkId];
          if (
            linkData[fromToOperator] == operator &&
            linkData[fromToConnector] == connector
          ) {
            if (maxI < linkData[fromToSubConnector]) {
              maxI = linkData[fromToSubConnector];
            }
          }
        }
      }

      var nbToDelete = Math.min(
        nbSubConnectors - maxI - 2,
        nbSubConnectors - 1
      );
      for (var i = 0; i < nbToDelete; i++) {
        subConnectors[subConnectors.length - 1].remove();
        subConnectors.pop();
        els.connectorArrows[connector].pop();
        els.connectorSmallArrows[connector].pop();
      }
    },

    deleteSelected: function() {
      if (this.selectedLinkId != null) {
        this.deleteLink(this.selectedLinkId);
      }
      if (this.selectedOperatorId != null) {
        console.log(this.data.operators);
        if (!this.data.operators[this.selectedOperatorId].properties.random) {
          this.deleteOperator(this.selectedOperatorId);
        }

        if (
          this.data.operators[this.selectedOperatorId].properties.random &&
          this.data.operators[this.selectedOperatorId].properties.title !=
            "Reject" &&
          this.data.operators[this.selectedOperatorId].properties.title !=
            "Approve"
        ) {
          let r = this.data.operators[this.selectedOperatorId].properties
            .random;
          for (var key in this.data.operators) {
            if (
              this.data.operators[key].properties.random == r &&
              this.data.operators[key].properties.title == "Approve"
            ) {
              this.deleteOperator(key);
            }
          }

          for (var key in this.data.operators) {
            if (
              this.data.operators[key].properties.random == r &&
              this.data.operators[key].properties.title == "Reject"
            ) {
              this.deleteOperator(key);
            }
          }

          for (var key in this.data.operators) {
            if (
              this.data.operators[key].properties.random == r &&
              this.data.operators[key].properties.title != "Approve" &&
              this.data.operators[key].properties.title != "Reject"
            ) {
              this.deleteOperator(key);
            }
          }
        }
      }
    },

    setPositionRatio: function(positionRatio) {
      this.positionRatio = positionRatio;
    },

    getPositionRatio: function() {
      return this.positionRatio;
    },

    getData: function() {
      var keys = ["operators", "links"];
      var data = {};
      data.operators = $.extend(true, {}, this.data.operators);
      data.links = $.extend(true, {}, this.data.links);
      for (var keyI in keys) {
        if (keys.hasOwnProperty(keyI)) {
          var key = keys[keyI];
          for (var objId in data[key]) {
            if (data[key].hasOwnProperty(objId)) {
              delete data[key][objId].internal;
            }
          }
        }
      }
      data.operatorTypes = this.data.operatorTypes;
      return data;
    },

    setOperatorTitle: function(operatorId, title) {
      this.data.operators[operatorId].internal.els.title.html(title);
      if (typeof this.data.operators[operatorId].properties == "undefined") {
        this.data.operators[operatorId].properties = {};
      }
      this.data.operators[operatorId].properties.title = title;
      this._refreshInternalProperties(this.data.operators[operatorId]);
      this.callbackEvent("afterChange", ["operator_title_change"]);
    },

    getOperatorTitle: function(operatorId) {
      return this.data.operators[operatorId].internal.properties.title;
    },

    setOperatorData: function(operatorId, operatorData) {
      console.log("setOperatorData", operatorId, operatorData);
      var infos = this.getOperatorCompleteData(operatorData);
      for (var linkId in this.data.links) {
        if (this.data.links.hasOwnProperty(linkId)) {
          var linkData = this.data.links[linkId];
          if (
            (linkData.fromOperator == operatorId &&
              typeof infos.outputs[linkData.fromConnector] == "undefined") ||
            (linkData.toOperator == operatorId &&
              typeof infos.inputs[linkData.toConnector] == "undefined")
          ) {
            this._deleteLink(linkId, true);
          }
        }
      }
      this._deleteOperator(operatorId, true);
      this.createOperator(operatorId, operatorData);
      this.redrawLinksLayer();
      this.callbackEvent("afterChange", ["operator_data_change"]);
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
