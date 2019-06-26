//config file
// 1) CONFIG FILE
// : Add new shapes
// : Add shape logic(One to Many, Many to many etc...)
// : Shape style(css)
// : Shape Arrow multiple arrows from 1 point

function setInitialShapeAttribute(shapeObject, attributesObjects) {
  const attributesArray = Object.keys(attributesObjects);
  for (let i = 0; i < attributesArray.length; i++) {
    shapeObject.setAttribute(
      attributesArray[i],
      attributesObjects[attributesArray[i]]
    );
  }
}

function createSvgElement(document, elementToCreate) {
  return document.createElementNS(
    "http://www.w3.org/2000/svg",
    elementToCreate
  );
}

function createLink(linkId, linkDataOriginal, self) {
  var linkData = $.extend(true, {}, linkDataOriginal);
  if (!self.callbackEvent("linkCreate", [linkId, linkData])) {
    return;
  }
  var node = self.data.operators[linkData.fromOperator].properties;
  var multipleLinkNotAllowed = node.random != null && node.name == "decision";
  const array = Object.keys(self.data.links).filter(index => {
    return self.data.links[index].fromOperator == linkData.fromOperator;
  });
  var haveTwoChildrenAlready = array.length == 2;
  console.log(array, self.data.links);

  return {
    multipleLinkNotAllowed: multipleLinkNotAllowed && haveTwoChildrenAlready,
    linkId,
    self,
    linkData
  };
}

function multipleLinkAvailableCheck(object) {
  const { multipleLinkNotAllowed, linkId, self, linkData } = object;
  if (!multipleLinkNotAllowed) {
    self.data.links[linkId] = linkData;
    //Time to draw out svg and path line
    self._drawLink(linkId);
  }
  self.callbackEvent("afterChange", ["link_create"]);
}

function addLink(linkData, self) {
  if (!linkData) {
    return;
  }
  //Called upon linking when both input and output connector is clicked
  let linkNum;

  //This.data.links is a object storing linkData
  while (typeof self.data.links[self.linkNum] != "undefined") {
    linkNum = self.linkNum++;
  }

  self.createLink(self.linkNum, linkData); //(0,linkData)
  return linkNum;
}

function operatorChangedPosition(operator_id, pos, operatorData, self) {
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

function createOperator(operatorObject, operatorData) {
  const { operatorId, title, self } = operatorObject;
  operatorData.internal = {};
  self._refreshInternalProperties(operatorData);
  var fullElement = self._getOperatorFullElement(operatorData);
  if (
    !self.callbackEvent("operatorCreate", [
      operatorId,
      operatorData,
      fullElement
    ])
  ) {
    return false;
  }

  var grid = self.options.grid;

  if (grid) {
    operatorData.top = Math.round(operatorData.top / grid) * grid;
    operatorData.left = Math.round(operatorData.left / grid) * grid;
  }

  fullElement.operator.appendTo(self.objs.layers.operators);
  fullElement.operator.css({
    position: "absolute",
    top: operatorData.top,
    left: operatorData.left
  });
  fullElement.operator.data("operator_id", operatorId);

  self.data.operators[operatorId] = operatorData;
  self.data.operators[operatorId].internal.els = fullElement;

  if (operatorId == self.selectedOperatorId) {
    self._addSelectedClass(operatorId);
  }

  // Small fix has been added in order to manage eventual zoom
  // http://stackoverflow.com/questions/2930092/jquery-draggable-with-zoom-problem
  if (self.options.canUserMoveOperators) {
    var pointerX;
    var pointerY;
    fullElement.operator.draggable({
      containment: operatorData.internal.properties.uncontained
        ? false
        : self.element,
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
              ((e.pageX - elementOffset.left) / self.positionRatio - pointerX) /
                grid
            ) * grid;
          console.log("ui.position.left", ui.position.left);
          ui.position.top =
            Math.round(
              ((e.pageY - elementOffset.top) / self.positionRatio - pointerY) /
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

          ui.offset.left = Math.round(ui.position.left + elementOffset.left);
          ui.offset.top = Math.round(ui.position.top + elementOffset.top);
          fullElement.operator.css({
            left: ui.position.left,
            top: ui.position.top
          });
        }

        operatorChangedPosition(
          $(this).data("operator_id"),
          ui.position,
          operatorData,
          self
        );

        console.log("ui.position", ui.position);
      },
      stop: function(e, ui) {
        self._unsetTemporaryLink();
        var operatorId = $(this).data("operator_id"); //operatorChangedPosition(operatorId, ui.position);
        self.callbackEvent("operatorMoved", [operatorId, ui.position]);
        self.callbackEvent("afterChange", ["operator_moved"]);
      }
    });
  }

  self.callbackEvent("afterChange", ["operator_create"]);

  return title;
}

function addOperator(addOperatorObject) {
  const { self, operatorData } = addOperatorObject;

  let operatorNum = self.operatorNum;

  let operators = self.data.operators;

  while (typeof self.data.operators[operatorNum] != "undefined") {
    operatorNum++; //Create the id of operator
  }
  //createOperator(operatorNum, operatorData, self); //Put the operatorData into the JSON object which is accessible through data.operators
  //Automatically popups of the Approve and Reject Operator
  var isItRejectNode = operatorData.properties.name === "Reject";

  return { operatorId: operatorNum, title: isItRejectNode, self };
}

function connectRejectAndApproveWithMother(operatorData, self) {
  let approveNum, rejectNum, motherNum;
  let r = operatorData.properties.random;
  let operators = self.data.operators;

  for (var key in operators) {
    let isApproveNodeAndSameMother =
      operators[key].properties.random == r &&
      operators[key].properties.name === "Approve";
    let isMotherNode =
      operators[key].properties.random === r &&
      operators[key].properties.name == "decision";
    let isRejectNode =
      operators[key].properties.random == r &&
      operators[key].properties.name === "Reject";

    if (isRejectNode) {
      rejectNum = key;
    } else if (isApproveNodeAndSameMother) {
      approveNum = key;
    } else if (isMotherNode) {
      motherNum = key;
    }
  }

  return {
    linkToApprove: {
      fromOperator: motherNum,
      toOperator: approveNum
    },
    linkToReject: {
      fromOperator: motherNum,
      toOperator: rejectNum
    },
    self
  };
}

function linkMotherToApproveAndReject(object) {
  const { self, linkToApprove, linkToReject } = object;
  self.addLink(createLinkDataForDecision(linkToApprove), self);
  self.addLink(createLinkDataForDecision(linkToReject), self);
}

function createLinkDataForDecision({ fromOperator, toOperator }) {
  return {
    fromOperator,
    toOperator,
    fromConnector: "output_0",
    toConnector: "input_0"
  };
}

function _deleteOperator(operatorId, replace, self) {
  if (!self.callbackEvent("operatorDelete", [operatorId, replace])) {
    return false;
  }
  if (!replace) {
    for (var linkId in self.data.links) {
      if (self.data.links.hasOwnProperty(linkId)) {
        var currentLink = self.data.links[linkId];
        if (
          currentLink.fromOperator == operatorId ||
          currentLink.toOperator == operatorId
        ) {
          self._deleteLink(linkId, true);
        }
      }
    }
  }
  if (!replace && operatorId == self.selectedOperatorId) {
    self.unselectOperator();
  }
  self.data.operators[operatorId].internal.els.operator.remove();
  delete self.data.operators[operatorId];

  self.callbackEvent("afterChange", ["operator_delete"]);

  for (var key in self.data.links) {
    self._refreshLinkPositions(key);
  }
}

function setData(data, self) {
  self.data.operatorTypes = {};
  self.data.operators = {};
  self.data.links = {};
  if (typeof data.operatorTypes != "undefined") {
    self.data.operatorTypes = data.operatorTypes;
  }

  for (var operatorId in data.operators) {
    if (data.operators.hasOwnProperty(operatorId)) {
      createOperator(
        { operatorId, self, title: true },
        data.operators[operatorId]
      );
    }
  }

  for (var linkId in data.links) {
    if (data.links.hasOwnProperty(linkId)) {
      self.createLink(linkId, data.links[linkId]);
    }
  }
}

function _deleteLink(linkId, forced, self) {
  if (self.selectedLinkId == linkId) {
    self.unselectLink();
  }
  if (!self.callbackEvent("linkDelete", [linkId, forced])) {
    if (!forced) {
      return;
    }
  }
  var linkData = self.data.links[linkId];
  var fromOperator = linkData.fromOperator;
  var fromConnector = linkData.fromConnector;
  var toOperator = linkData.toOperator;
  var toConnector = linkData.toConnector;
  linkData.internal.els.overallGroup.remove();
  delete self.data.links[linkId];

  return {
    fromOperator,
    fromConnector,
    toOperator,
    toConnector
  };
}

function deleteLink(linkId, self) {
  let fromOperator = self.data.links[linkId].fromOperator;
  let toOperator = self.data.links[linkId].toOperator;
  let notTheDecisionNode = !self.data.operators[fromOperator].properties.random;
  let notConnectedToDecisionNode = !self.data.operators[toOperator].properties
    .random;
  if (notTheDecisionNode || notTheDecisionNode) {
    self._deleteLink(linkId, false);
  }
}

function deleteSelected(self) {
  var operators = self.data.operators;
  if (self.selectedLinkId != null) {
    deleteLink(self.selectedLinkId, self);
  }
  if (self.selectedOperatorId != null) {
    var notADeciderNode = !operators[self.selectedOperatorId].properties.random;
    var isAMotherOfDecideNode =
      operators[self.selectedOperatorId].properties.random &&
      operators[self.selectedOperatorId].properties.name == "decision";

    if (notADeciderNode) {
      return self.deleteOperator(self.selectedOperatorId);
    }

    if (isAMotherOfDecideNode) {
      //If it the selected to be deleted one is the mother that have children, delete the children also
      let r = self.data.operators[self.selectedOperatorId].properties.random;
      for (var key in self.data.operators) {
        let isApproveNode =
          operators[key].properties.random === r &&
          operators[key].properties.name === "Approve";
        let isRejectNode =
          operators[key].properties.random === r &&
          operators[key].properties.name === "Reject";
        let isMotherNode =
          operators[key].properties.random === r &&
          operators[key].properties.name == "decision";

        if (isApproveNode || isRejectNode || isMotherNode) {
          self.deleteOperator(key);
        }
      }
    }
  }
}

function selectLink(linkId, self) {
  self.unselectLink();
  if (!self.callbackEvent("linkSelect", [linkId])) {
    return;
  }
  self.unselectOperator();
  self.selectedLinkId = linkId;

  let toOperator = self.data.links[linkId].toOperator;
  let fromOperator = self.data.links[linkId].fromOperator;
  let notConnectedToApproveOrRejectNodes =
    !self.data.operators[toOperator].properties.random ||
    !self.data.operators[fromOperator].properties.random;

  return notConnectedToApproveOrRejectNodes;
}

function unselectLink(self) {
  if (self.selectedLinkId != null) {
    if (!self.callbackEvent("linkUnselect", [])) {
      return;
    }
    self.selectedLinkId = null;
  }
}

function setLineAttribute(lineObject, attributesObject) {
  const attributesArray = Object.keys(attributesObject);
  for (let i = 0; i < attributesArray.length; i++) {
    lineObject.setAttribute(
      attributesArray[i],
      attributesObject[attributesArray[i]]
    );
  }
  lineObject.setAttribute("stroke", "black");
}

function setLinesAttribute(object) {
  const { linesObject, attributesObjects } = object;
  const linesArray = Object.keys(linesObject).slice(3);
  for (let i = 0; i < linesArray.length; i++) {
    setLineAttribute(
      linesObject[linesArray[i]],
      attributesObjects[linesArray[i]]
    );
  }
}

function _refreshLinkPositions(linkId, self) {
  var linkData = self.data.links[linkId];
  var subConnectors = self._getSubConnectors(linkData);
  var fromSubConnector = subConnectors[0];
  var toSubConnector = subConnectors[1];
  var fromPosition = self.getConnectorPosition(
    linkData.fromOperator,
    linkData.fromConnector,
    fromSubConnector
  );
  var toPosition = self.getConnectorPosition(
    linkData.toOperator,
    linkData.toConnector,
    toSubConnector
  );
  let linesData;
  var fromX = fromPosition.x;
  var offsetFromX = fromPosition.width;
  var fromY = fromPosition.y;
  var toX = toPosition.x;
  var toY = toPosition.y;
  var distanceFromArrow = self.options.distanceFromArrow;
  var xdiff = toX - fromX < 0 ? -(toX - fromX) : toX - fromX;
  var ydiff = toY - fromY < 0 ? -(toY - fromY) : toY - fromY;
  var halfYdiff = ydiff / 2;
  var halfXdiff = xdiff / 2;
  let isDirectlyAbove = xdiff == 0 && toY - fromY < 0;
  let isInDirectlyAbove = toY - fromY < 0 && xdiff != 0;
  let isBeside = toY - fromY < 62 && toY - fromY >= -20 && xdiff >= 100;

  if (isBeside) {
    linesData = {
      line1: {
        x1: fromX + offsetFromX,
        y1: fromY,
        x2: fromX + offsetFromX,
        y2: fromY + 80
      },
      line2: {
        x1: fromX + offsetFromX,
        y1: fromY + 80,
        x2: toX + (toX - fromX) * 1.5,
        y2: fromY + 80
      },
      line3: {
        x1: toX + (toX - fromX) * 1.5,
        y1: fromY + 80,
        x2: toX + (toX - fromX) * 1.5,
        y2: fromY - 40
      },
      line4: {
        x1: toX + (toX - fromX) * 1.5,
        y1: fromY - 40,
        x2: toX + offsetFromX,
        y2: fromY - 40
      },
      line5: {
        x1: toX + offsetFromX,
        y1: fromY - 40,
        x2: toX + offsetFromX,
        y2: toY
      }
    };
  } else if (isInDirectlyAbove) {
    linesData = {
      line1: {
        x1: fromX + offsetFromX,
        y1: fromY,
        x2: fromX + offsetFromX,
        y2: fromY + halfYdiff
      },
      line2: {
        x1: fromX + offsetFromX,
        y1: fromY + halfYdiff,
        x2: toX + offsetFromX + halfXdiff,
        y2: fromY + halfYdiff
      },
      line3: {
        x1: toX + offsetFromX + halfXdiff,
        y1: fromY + halfYdiff,
        x2: toX + offsetFromX + halfXdiff,
        y2: toY - halfYdiff
      },
      line4: {
        x1: toX + offsetFromX + halfXdiff,
        y1: toY - halfYdiff,
        x2: toX + offsetFromX,
        y2: toY - halfYdiff
      },
      line5: {
        x1: toX + offsetFromX,
        y1: toY,
        x2: toX + offsetFromX,
        y2: toY - halfYdiff
      }
    };
  } else if (isDirectlyAbove) {
    linesData = {
      line1: {
        x1: fromX + offsetFromX,
        y1: fromY,
        x2: fromX + offsetFromX,
        y2: fromY + halfYdiff
      },
      line2: {
        x1: fromX + offsetFromX,
        y1: fromY + halfYdiff,
        x2: fromX + offsetFromX + 200,
        y2: fromY + halfYdiff
      },
      line3: {
        x1: fromX + offsetFromX + 200,
        y1: fromY + halfYdiff,
        x2: toX + offsetFromX + halfXdiff + 200,
        y2: toY - halfYdiff
      },
      line4: {
        x1: toX + offsetFromX + halfXdiff,
        y1: toY - halfYdiff,
        x2: toX + offsetFromX + halfXdiff + 200,
        y2: toY - halfYdiff
      },
      line5: {
        x1: toX + offsetFromX,
        y1: toY,
        x2: toX + offsetFromX,
        y2: toY - halfYdiff
      }
    };
  } else {
    linesData = {
      line1: {
        x1: fromX + offsetFromX,
        y1: fromY,
        x2: fromX + offsetFromX,
        y2: fromY + halfYdiff
      },
      line2: {
        x1: fromX + offsetFromX,
        y1: fromY + halfYdiff,
        x2: toX + offsetFromX,
        y2: toY - halfYdiff
      },
      line3: {
        x1: toX + offsetFromX,
        y1: toY - halfYdiff,
        x2: toX + offsetFromX,
        y2: toY
      },
      line4: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      },
      line5: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      }
    };
  }

  return { linesObject: linkData.internal.els, attributesObjects: linesData };
}

function getData(self) {
  var keys = ["operators", "links"];
  var data = {};
  data.operators = $.extend(true, {}, self.data.operators);
  data.links = $.extend(true, {}, self.data.links);
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
  data.operatorTypes = self.data.operatorTypes;
  return data;
}

function _drawLink(linkId, self) {
  var linkData = self.data.links[linkId];
  if (typeof linkData.internal == "undefined") {
    linkData.internal = {};
  }
  linkData.internal.els = {};
  var fromOperatorId = linkData.fromOperator;
  var fromConnectorId = linkData.fromConnector;
  var toOperatorId = linkData.toOperator;
  var toConnectorId = linkData.toConnector;
  var subConnectors = self._getSubConnectors(linkData);
  var fromSubConnector = subConnectors[0];
  var toSubConnector = subConnectors[1];
  var color = self.getLinkMainColor(linkId);
  var fromOperator = self.data.operators[fromOperatorId];
  var toOperator = self.data.operators[toOperatorId];
  var fromSmallConnector =
    fromOperator.internal.els.connectorSmallArrows[fromConnectorId][
      fromSubConnector
    ];
  var toSmallConnector =
    toOperator.internal.els.connectorSmallArrows[toConnectorId][toSubConnector];
  linkData.internal.els.fromSmallConnector = fromSmallConnector;
  linkData.internal.els.toSmallConnector = toSmallConnector;

  return {
    linkData,
    linkId,
    self
  };
}

function selectOperator(operatorId, self) {
  const objId = self.data.operators[operatorId].properties.objectId;
  console.log("Emitting event: nodeClicked with objectId: ", objId);
  const nodeClicked = new Event("nodeClicked", { objId });
  window.dispatchEvent(nodeClicked);
  self.selectedLinkId = null;
  $(`.flowchart-link line`).each(function() {
    $(self).attr("stroke", "black");
  });
  if (!self.callbackEvent("operatorSelect", [operatorId])) {
    return;
  }
  self.selectedOperatorId = operatorId;
  return operatorId;
}

function setOperatorData(operatorId, operatorData, self) {
  console.log("setOperatorData", operatorId, operatorData);
  var infos = self.getOperatorCompleteData(operatorData);
  for (var linkId in self.data.links) {
    if (self.data.links.hasOwnProperty(linkId)) {
      var linkData = self.data.links[linkId];
      if (
        (linkData.fromOperator == operatorId &&
          typeof infos.outputs[linkData.fromConnector] == "undefined") ||
        (linkData.toOperator == operatorId &&
          typeof infos.inputs[linkData.toConnector] == "undefined")
      ) {
        self._deleteLink(linkId, true);
      }
    }
  }
}

function createAssignAndAppendLines(object) {
  const { self, linkData, linkId } = object;

  var group = createSvgElement(document, "g");
  var overallGroup = createSvgElement(document, "g");
  group.setAttribute("class", "flowchart-link");
  group.setAttribute("data-link_id", linkId);
  overallGroup.appendChild(group);
  self.objs.layers.links[0].appendChild(overallGroup);
  linkData.internal.els.overallGroup = overallGroup;

  for (let i = 0; i < 5; i++) {
    let attr = `line${i + 1}`;
    linkData.internal.els[attr] = createSvgElement(document, "line");
    group.appendChild(linkData.internal.els[attr]);
  }

  return linkId;
}

function setOperatorTitle(operatorId, title, self) {
  self.data.operators[operatorId].internal.els.title.html(title);
  if (typeof self.data.operators[operatorId].properties == "undefined") {
    self.data.operators[operatorId].properties = {};
  }
  self.data.operators[operatorId].properties.title = title;
  self._refreshInternalProperties(self.data.operators[operatorId]);
  self.callbackEvent("afterChange", ["operator_title_change"]);
}

function _cleanMultipleConnectors(operator, connector, linkFromTo, self) {
  if (
    !self.data.operators[operator].properties[
      linkFromTo == "from" ? "outputs" : "inputs"
    ][connector].multiple
  ) {
    return;
  }

  var maxI = -1;
  var fromToOperator = linkFromTo + "Operator";
  var fromToConnector = linkFromTo + "Connector";
  var fromToSubConnector = linkFromTo + "SubConnector";
  var els = self.data.operators[operator].internal.els;
  var subConnectors = els.connectors[connector];
  var nbSubConnectors = subConnectors.length;

  for (var linkId in self.data.links) {
    if (self.data.links.hasOwnProperty(linkId)) {
      var linkData = self.data.links[linkId];
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

  var nbToDelete = Math.min(nbSubConnectors - maxI - 2, nbSubConnectors - 1);
  for (var i = 0; i < nbToDelete; i++) {
    subConnectors[subConnectors.length - 1].remove();
    subConnectors.pop();
    els.connectorArrows[connector].pop();
    els.connectorSmallArrows[connector].pop();
  }
}

function getConnectorPosition(operatorId, connectorId, subConnector, self) {
  var operatorData = self.data.operators[operatorId];
  var $connector =
    operatorData.internal.els.connectorArrows[connectorId][subConnector];

  var connectorOffset = $connector.offset();
  var elementOffset = self.element.offset();

  var x = (connectorOffset.left - elementOffset.left) / self.positionRatio;
  var width = parseInt($connector.css("border-top-width"));
  var y =
    (connectorOffset.top - elementOffset.top - 1) / self.positionRatio +
    parseInt($connector.css("border-left-width"));

  return { x: x, width: width, y: y };
}

function getOperatorCompleteData(operatorData, self) {
  if (typeof operatorData.internal == "undefined") {
    operatorData.internal = {};
  }
  self._refreshInternalProperties(operatorData);
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
    infos.class = self.options.defaultOperatorClass;
  }
  return infos;
}

function _getOperatorFullElement(operatorData, self) {
  var infos = self.getOperatorCompleteData(operatorData);

  console.log("infos", infos);

  if (infos.func == "decider") {
    console.log("Decider");
  }

  var $operator = $('<div class="flowchart-operator"></div>');
  $operator.addClass(infos.class);
  $operator.addClass(infos.shape);

  console.log("info.class", infos.class);

  let $container = $('<div class="container"></div>');

  $container.appendTo($operator);

  let $row = $('<div class="row"></div>');

  $row.appendTo($container);

  let $icon = $("<div class='col-sm-2'></div>");

  let $mailIcon = $(
    '<span class="glyphicon" style="color:black;font-size:30px">&#x2709;</span>'
  );

  $mailIcon.appendTo($icon);

  $icon.appendTo($row);

  let $title = $("<div class='col-sm-10'></div>");

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

  var $operator_outputs = $('<div class="flowchart-operator-outputs"></div>');
  $operator_outputs.appendTo($operator_inputs_outputs);

  var self = self;

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
    connectorType
  ) {
    var $operator_connector_set = $(
      '<div class="flowchart-operator-connector-set"></div>'
    );

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
      connectorType
    );
  }

  for (var key_i in infos.inputs) {
    if (infos.inputs.hasOwnProperty(key_i)) {
      addConnector(key_i, infos.inputs[key_i], $operator_inputs, "inputs");
    }
  }
  for (var key_o in infos.outputs) {
    if (infos.outputs.hasOwnProperty(key_o)) {
      addConnector(key_o, infos.outputs[key_o], $operator_outputs, "outputs");
    }
  }

  return fullElement;
}

function _createSubConnector(
  connectorKey,
  connectorInfos,
  fullElement,
  connectorType
) {
  var $operator_connector_set = fullElement.connectorSets[connectorKey];
  var subConnector = fullElement.connectors[connectorKey].length;
  var $operator_connector = $(
    '<div class="flowchart-operator-connector"></div>'
  );
  var $operator_connector_arrow = $(
    '<div class="flowchart-operator-connector-arrow"></div>'
  );
  var $operator_connector_small_arrow = $(
    '<div class="flowchart-operator-connector-small-arrow" style="position:relative"></div>'
  );
  var isInputConnector = connectorType === "inputs";

  if (isInputConnector) {
    $operator_connector_small_arrow = $(
      '<div class="flowchart-operator-connector-small-arrow" style="position:relative"></div>'
    );
  }

  $operator_connector.appendTo($operator_connector_set);
  $operator_connector.data("connector", connectorKey);
  $operator_connector.data("sub_connector", subConnector);
  $operator_connector_arrow.appendTo($operator_connector);
  //Operator connector arrow
  $operator_connector_small_arrow.appendTo($operator_connector_arrow);
  fullElement.connectors[connectorKey].push($operator_connector);
  fullElement.connectorArrows[connectorKey].push($operator_connector_arrow);
  fullElement.connectorSmallArrows[connectorKey].push(
    $operator_connector_small_arrow
  );
}

function _connectorClicked(
  operator,
  connector,
  subConnector,
  connectorCategory,
  self
) {
  if (connectorCategory == "outputs") {
    var d = new Date();
    // var currentTime = d.getTime();
    self.lastOutputConnectorClicked = {
      operator: operator,
      connector: connector,
      subConnector: subConnector
    };

    self.objs.layers.temporaryLink.show();

    var position = self.getConnectorPosition(operator, connector, subConnector);

    var x = position.x + position.width;
    var y = position.y;

    //Where is temporaryLink; This set the starting point of the temporary link
    self.objs.temporaryLink.setAttribute("x1", x.toString());
    self.objs.temporaryLink.setAttribute("y1", y.toString());

    //Where is mousemove? Setting the initial position of the hint line first
    self._mousemove(x, y);
    return null;
  }
  if (
    //Check if input connector is pressed and check if output connector is clicked beforehand
    connectorCategory == "inputs" &&
    self.lastOutputConnectorClicked != null
  ) {
    var linkData = {
      fromOperator: self.lastOutputConnectorClicked.operator,
      fromConnector: self.lastOutputConnectorClicked.connector,
      fromSubConnector: self.lastOutputConnectorClicked.subConnector,
      toOperator: operator,
      toConnector: connector,
      toSubConnector: subConnector
    };

    //Linkdata specify which output of which operator is connected to which input of which operator
    self._unsetTemporaryLink();
    return linkData;
  }
}

function _getSubConnectors(linkData) {
  var fromSubConnector = 0;
  if (typeof linkData.fromSubConnector != "undefined") {
    fromSubConnector = linkData.fromSubConnector;
  }

  var toSubConnector = 0;
  if (typeof linkData.toSubConnector != "undefined") {
    toSubConnector = linkData.toSubConnector;
  }

  return [fromSubConnector, toSubConnector];
}

function getOperatorFullProperties(operatorData, self) {
  if (typeof operatorData.type != "undefined") {
    var typeProperties = self.data.operatorTypes[operatorData.type];
    var operatorProperties = {};
    if (typeof operatorData.properties != "undefined") {
      operatorProperties = operatorData.properties;
    }
    return $.extend({}, typeProperties, operatorProperties);
  } else {
    return operatorData.properties;
  }
}

function _click(x, y, e, self) {
  var $target = $(e.target);
  var $flowchart_temporary_link_layer = $(".flowchart-temporary-link-layer");
  var lastLineDrawn = $(".flowchart-temporary-link-layer line:last-child");
  var nextLine = createSvgElement(document, "line");
  const array = ["x1", "x2", "y1", "y2"];
  if (self.lastOutputConnectorClicked != null) {
    // isStraightLine = x - x1 < 0 ? -(x - x1) : x - x1;
    // isPerpendicular = y - y1 < 0 ? -(y - y1) : y - y1;
    //What to do when a connector is clicked and the temporary link is drag ann CLICKED on the svg of the flowchart
    //if (isStraightLine < 5 || isPerpendicular < 5) {
    self.objs.temporaryLink.setAttribute("x2", x);
    self.objs.temporaryLink.setAttribute("y2", y);

    if ($target[0].tagName == "svg") {
      for (let i = 0; i < array.length; i++) {
        if (array[i] === "x1" || array[i] === "x2") {
          nextLine.setAttribute(array[i], lastLineDrawn.attr("x2"));
        } else {
          nextLine.setAttribute(array[i], lastLineDrawn.attr("y2"));
        }
      }
      nextLine.setAttribute("stroke", "black");
      nextLine.setAttribute("fill", "none");
      $flowchart_temporary_link_layer.append(nextLine);
      self.objs.temporaryLink = $(
        ".flowchart-temporary-link-layer line:last-child"
      )[0];
    }
    //}
  }
  // if ($target.closest(".flowchart-operator-connector").length == 0 ) {
  //   self._unsetTemporaryLink();
  // }

  if ($target.closest(".flowchart-operator").length == 0) {
    self.unselectOperator();
  }

  // if ($target.closest(".flowchart-link").length == 0) {
  //   self.unselectLink();
  // }
}

function _initEvents(self) {
  //Customised listener

  //self.data.operators is the data of whole diagram

  //IF the flow chart title is double clicked, then the input will be visible
  self.objs.layers.operators.on("dblclick", ".flowchart-span-title", function(
    e
  ) {
    //Find nearest input field and remove the input-invisible class
    $(e.target)
      .next()
      .show();
    $(e.target).hide();
  });

  self.objs.layers.operators.on("dblclick", ".input-inside-operator", function(
    e
  ) {
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
  });

  self.objs.layers.operators.on("keypress", ".input-inside-operator", function(
    e
  ) {
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
  });

  //End of customised listener
  self.element.dblclick(function(e) {
    if ($(e.target).attr("class") == "flowchart-links-layer") {
      removeGuidanceLine(e, self);
    }
  });

  self.element.mousemove(function(e) {
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

  self.element.click(function(e) {
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

  self.objs.layers.operators.on(
    "pointerdown mousedown touchstart",
    ".flowchart-operator",
    function(e) {
      e.stopImmediatePropagation();
    }
  );

  self.objs.layers.operators.on("click", ".flowchart-operator", function(e) {
    console.log(
      "connector",
      $(e.target).closest(".flowchart-operator-connector")
    );
    if ($(e.target).closest(".flowchart-operator-connector").length == 0) {
      self.selectOperator($(this).data("operator_id"));
      console.log("Newly created operator", $(this).data("operator_id"));
    }
    if (
      self.lastOutputConnectorClicked != null &&
      self.lastOutputConnectorClicked.operator !== $(this).data("operator_id")
    ) {
      self.addLink({
        fromOperator: self.lastOutputConnectorClicked.operator,
        fromConnector: "output_0",
        toOperator: $(this).data("operator_id"),
        toConnector: "input_0"
      });
      removeGuidanceLine(e, self);
    }
  });

  //When the connector is clicked and ready to connect
  self.objs.layers.operators.on(
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

  self.objs.layers.links.on("mouseover dblclick", ".flowchart-link", function(
    e
  ) {
    console.log(self.selectedLinkId);
    self._connecterMouseOver($(this).data("link_id"));
    self.selectLink($(this).data("link_id"));
  });

  // this.objs.layers.links.on("click", ".flowchart-link", function(e) {
  //   console.log("linkId", $(this).data("link_id"));
  //   self.selectLink($(this).data("link_id"));
  // });

  self.objs.layers.operators.on("mouseover", ".flowchart-operator", function(
    e
  ) {
    console.log($(this));
    self._operatorMouseOver($(this).data("operator_id"));
    // console.log("mouseover", $(this).data("operator_id"));
  });

  self.objs.layers.operators.on("mouseout", ".flowchart-operator", function(e) {
    // console.log("........................ 350")
    // console.log(e)
    // console.log("........................ 350")
    self._operatorMouseOut($(this).data("operator_id"));
  });
}

function removeGuidanceLine(e, self) {
  let firstLine = $(".flowchart-temporary-link-layer line:first-child");
  firstLine[0].setAttribute("x2", firstLine.attr("x1"));
  firstLine[0].setAttribute("y2", firstLine.attr("y1"));
  $(".flowchart-temporary-link-layer").html(firstLine);
  self.objs.temporaryLink = $(
    ".flowchart-temporary-link-layer line:last-child"
  )[0];
  self.lastOutputConnectorClicked = null;
}

function _create(self) {
  if (typeof document.__flowchartNumber == "undefined") {
    document.__flowchartNumber = 0;
  } else {
    document.__flowchartNumber++;
  }
  self.globalId = document.__flowchartNumber;
  self._unitVariables();

  self.element.addClass("flowchart-container");

  self.objs.layers.links = $('<svg class="flowchart-links-layer"></svg>');
  self.objs.layers.links.appendTo(self.element);

  self.objs.layers.operators = $(
    '<div class="flowchart-operators-layer unselectable"></div>'
  );
  self.objs.layers.operators.appendTo(self.element);

  self.objs.layers.temporaryLink = $(
    '<svg class="flowchart-temporary-link-layer"></svg>'
  );
  self.objs.layers.temporaryLink.appendTo(self.element);

  var shape = document.createElementNS("http://www.w3.org/2000/svg", "line");

  //The dotted line is created here which we saw during dragging the line
  setInitialShapeAttribute(shape, {
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "0",
    "stroke-width": "1",
    stroke: "black",
    fill: "none"
  });
  self.objs.layers.temporaryLink[0].appendChild(shape);

  //This.objs.temporary link now refers to the temporary guiding black line
  //self.objs.temporaryLink = shape;

  self.objs.temporaryLink = $(
    ".flowchart-temporary-link-layer line:last-child"
  )[0];

  self._initEvents();

  if (typeof self.options.data != "undefined") {
    self.setData(self.options.data);
  }
}

module.exports = {
  addOperator,
  createOperator,
  addLink,
  setData,
  createLink,
  deleteLink,
  deleteSelected,
  _deleteLink,
  _deleteOperator,
  selectLink,
  unselectLink,
  _refreshLinkPositions,
  getData,
  setInitialShapeAttribute,
  createSvgElement,
  setOperatorData,
  createAssignAndAppendLines,
  setOperatorTitle,
  _drawLink,
  _cleanMultipleConnectors,
  getConnectorPosition,
  getOperatorCompleteData,
  _getOperatorFullElement,
  _createSubConnector,
  _connectorClicked,
  connectRejectAndApproveWithMother,
  linkMotherToApproveAndReject,
  _connectorClicked,
  setLinesAttribute,
  _getSubConnectors,
  selectOperator,
  createAssignAndAppendLines,
  getOperatorFullProperties,
  _click,
  _initEvents,
  _create,
  _createSubConnector,
  multipleLinkAvailableCheck
};
