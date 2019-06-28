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
      multipleLinksOnOutput: true,
      multipleLinksOnInput: true,
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
      RefactoredFunctions._create(this);
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
      RefactoredFunctions._initEvents(this);
    },

    //Entry point of the program
    setData: function(data) {
      this._clearOperatorsLayer();
      RefactoredFunctions.setData(data, this);
      this.redrawLinksLayer();
    },

    addLink: function(linkData) {
      this.createLink(
        RefactoredFunctions.addLink(linkData, this) /*return linkId*/,
        linkData
      );
    },

    createLink: function(linkId, linkDataOriginal) {
      RefactoredFunctions.multipleLinkAvailableCheck(
        RefactoredFunctions.createLink(linkId, linkDataOriginal, this)
      );
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
      var linkId = RefactoredFunctions.createAssignAndAppendLines(
        RefactoredFunctions._drawLink(linkId, this)
      );

      this._refreshLinkPositions(linkId);
      this.uncolorizeLink(linkId);
    },

    _getSubConnectors: function(linkData) {
      return RefactoredFunctions._getSubConnectors(linkData);
    },

    //Setting the x and y attribute of the shape created in _drawlink
    _refreshLinkPositions: function(linkId) {
      RefactoredFunctions.setLinesAttribute(
        RefactoredFunctions._refreshLinkPositions(linkId, this)
      );
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
      RefactoredFunctions._createSubConnector(
        connectorKey,
        connectorInfos,
        fullElement,
        connectorType,
        bottomPadding,
        func
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
      RefactoredFunctions.createOperator(
        { operatorId, self: this, title: true },
        operatorData
      );
    },

    //This is the callback function when connector is clicked

    _connectorClicked: function(
      operator,
      connector,
      subConnector,
      connectorCategory
    ) {
      this.addLink(
        RefactoredFunctions._connectorClicked(
          operator,
          connector,
          subConnector,
          connectorCategory,
          this
        )
      );
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
      RefactoredFunctions._click(x, y, e, this, document);
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
      this._addSelectedClass(
        RefactoredFunctions.selectOperator(operatorId, this)
      );
      this.unselectLink();
      this._removeSelectedClassOperators();
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
      const {
        fromOperator,
        fromConnector,
        toOperator,
        toConnector
      } = RefactoredFunctions._deleteLink(linkId, forced, this);
      this.colorizeLink(linkId, "transparent");
      this._cleanMultipleConnectors(fromOperator, fromConnector, "from");
      this._cleanMultipleConnectors(toOperator, toConnector, "to");
      this.callbackEvent("afterChange", ["link_delete"]);
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
      this._deleteOperator(operatorId, true);
      this.createOperator(
        { operatorId, self: this, title: true },
        operatorData
      );
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
      return RefactoredFunctions.getOperatorFullProperties(operatorData, this);
    },

    _refreshInternalProperties: function(operatorData) {
      operatorData.internal.properties = this.getOperatorFullProperties(
        operatorData
      );
    }
  });
});
