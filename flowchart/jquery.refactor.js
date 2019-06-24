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

function createLinkData(linkDataObject) {
  const {
    fromOperator,
    fromConnector,
    toOperator,
    toConnector
  } = linkDataObject;
  return {
    fromOperator: fromOperator,
    fromConnector: fromConnector,
    fromSubConnector: 0,
    toOperator: toOperator,
    toConnector: toConnector,
    toSubConnector: 0
  };
}

function createLink(linkId, linkDataOriginal, self) {
  var linkData = $.extend(true, {}, linkDataOriginal);
  if (!self.callbackEvent("linkCreate", [linkId, linkData])) {
    return;
  }

  console.log("Line 339 of createLink", self.data.links);

  var subConnectors = self._getSubConnectors(linkData);
  //Getting the output connector involved
  var fromSubConnector = subConnectors[0];

  //Getting the input connector involved
  var toSubConnector = subConnectors[1];

  //Check if the connector is already connected, the old connection will be abolished,i.e. the old object will be removed
  //from the self.data.link object
  var multipleLinksOnOutput = self.options.multipleLinksOnOutput;
  var multipleLinksOnInput = self.options.multipleLinksOnInput;
  if (!multipleLinksOnOutput || !multipleLinksOnInput) {
    for (var linkId2 in self.data.links) {
      if (self.data.links.hasOwnProperty(linkId2)) {
        var currentLink = self.data.links[linkId2];

        var currentSubConnectors = self._getSubConnectors(currentLink);
        var currentFromSubConnector = currentSubConnectors[0];
        var currentToSubConnector = currentSubConnectors[1];

        var fromIsAlreadyConnected =
          !multipleLinksOnOutput &&
          currentLink.fromOperator == linkData.fromOperator &&
          currentLink.fromConnector == linkData.fromConnector &&
          currentFromSubConnector == fromSubConnector;
        var toIsAlreadyConnected =
          !multipleLinksOnInput &&
          currentLink.toOperator == linkData.toOperator &&
          currentLink.toConnector == linkData.toConnector &&
          currentToSubConnector == toSubConnector;

        if (fromIsAlreadyConnected) {
          self.deleteLink(linkId2);
          continue;
        }
        if (toIsAlreadyConnected) {
          self.deleteLink(linkId2);
        }
      }
    }
  }

  //new linkData is inserted into self.data.links
  self.data.links[linkId] = linkData;

  //Time to draw out svg and path line
  self._drawLink(linkId);

  self.callbackEvent("afterChange", ["link_create"]);
}

function addLink(linkData, self) {
  //Called upon linking when both input and output connector is clicked
  console.log("links", self.data.links);
  console.log(
    "link.this.data.operators from addLink function",
    self.data.operators
  );

  //This.data.links is a object storing linkData
  while (typeof self.data.links[self.linkNum] != "undefined") {
    self.linkNum++;
  }

  createLink(self.linkNum, linkData, self); //(0,linkData)
  return self.linkNum;
}

function createOperator(operatorId, operatorData, self) {
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
        console.log(self.data.operators);
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

        operatorChangedPosition($(this).data("operator_id"), ui.position);

        console.log("ui.position", ui.position);
      },
      stop: function(e, ui) {
        self._unsetTemporaryLink();
        var operatorId = $(this).data("operator_id");
        operatorChangedPosition(operatorId, ui.position);
        self.callbackEvent("operatorMoved", [operatorId, ui.position]);
        self.callbackEvent("afterChange", ["operator_moved"]);
      }
    });
  }

  self.callbackEvent("afterChange", ["operator_create"]);
}

function addOperator(addOperatorObject) {
  const { self, operatorData } = addOperatorObject;

  let operatorNum = self.operatorNum;

  let operators = self.data.operators;

  while (typeof self.data.operators[operatorNum] != "undefined") {
    operatorNum++; //Create the id of operator
  }

  createOperator(operatorNum, operatorData, self); //Put the operatorData into the JSON object which is accessible through data.operators

  //Automatically popups of the Approve and Reject Operator
  var isItRejectNode = operatorData.properties.title === "Reject";

  if (isItRejectNode) {
    let approveNum, rejectNum, motherNum;
    let r = operatorData.properties.random;

    for (var key in operators) {
      let isApproveNodeAndSameMother =
        operators[key].properties.random == r &&
        operators[key].properties.title === "Approve";
      let isMotherNode =
        operators[key].properties.random === r &&
        operators[key].properties.title != "Approve" &&
        operators[key].properties.title != "Reject";
      if (isApproveNodeAndSameMother) {
        approveNum = key;
      }

      if (isMotherNode) {
        motherNum = key;
      }
    }

    //Add Link object into JSON object that contains all the link which is called data.links
    addLink(
      createLinkData({
        fromOperator: motherNum,
        fromConnector: "output_0",
        toOperator: approveNum,
        toConnector: "input_0"
      }),
      self
    );

    addLink(
      createLinkData({
        fromOperator: motherNum,
        fromConnector: "output_1",
        toOperator: operatorNum,
        toConnector: "input_0"
      }),
      self
    );
    return operatorNum;
  }
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
  console.log("setData", data.operators, data.operatorTypes);
  self._clearOperatorsLayer();
  self.data.operatorTypes = {};
  self.data.operators = {};
  self.data.links = {};
  if (typeof data.operatorTypes != "undefined") {
    self.data.operatorTypes = data.operatorTypes;
  }

  for (var operatorId in data.operators) {
    if (data.operators.hasOwnProperty(operatorId)) {
      self.createOperator(operatorId, data.operators[operatorId], self);
    }
  }

  console.log("data.operators", data.operators);

  for (var linkId in data.links) {
    if (data.links.hasOwnProperty(linkId)) {
      self.createLink(linkId, data.links[linkId]);
    }
  }
  self.redrawLinksLayer();
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
  self.colorizeLink(linkId, "transparent");
  var linkData = self.data.links[linkId];
  var fromOperator = linkData.fromOperator;
  var fromConnector = linkData.fromConnector;
  var toOperator = linkData.toOperator;
  var toConnector = linkData.toConnector;
  linkData.internal.els.overallGroup.remove();
  delete self.data.links[linkId];

  self._cleanMultipleConnectors(fromOperator, fromConnector, "from");
  self._cleanMultipleConnectors(toOperator, toConnector, "to");

  self.callbackEvent("afterChange", ["link_delete"]);
}

function deleteLink(linkId, self) {
  let fromOperator = self.data.links[linkId].fromOperator;
  let toOperator = self.data.links[linkId].toOperator;
  if (
    !self.data.operators[fromOperator].properties.random ||
    !self.data.operators[toOperator].properties.random
  ) {
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
      operators[self.selectedOperatorId].properties.title != "Reject" &&
      operators[self.selectedOperatorId].properties.title != "Approve";

    if (notADeciderNode) {
      self.deleteOperator(self.selectedOperatorId);
    }

    if (isAMotherOfDecideNode) {
      //If it the selected to be deleted one is the mother that have children, delete the children also
      let r = self.data.operators[self.selectedOperatorId].properties.random;
      for (var key in self.data.operators) {
        let isApproveNode =
          operators[key].properties.random === r &&
          operators[key].properties.title === "Approve";
        let isRejectNode =
          operators[key].properties.random === r &&
          operators[key].properties.title === "Reject";
        let isMotherNode =
          operators[key].properties.random === r &&
          operators[key].properties.title != "Approve" &&
          operators[key].properties.title != "Reject";

        if (isApproveNode) {
          self.deleteOperator(key);
        }

        if (isRejectNode) {
          self.deleteOperator(key);
        }

        if (isMotherNode) {
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

function setLinesAttribute(linesObject, attributesObjects) {
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
    setLinesAttribute(linkData.internal.els, linesData);
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
    setLinesAttribute(linkData.internal.els, linesData);
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
    setLinesAttribute(linkData.internal.els, linesData);
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
    setLinesAttribute(linkData.internal.els, linesData);
  }
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

  createAssignAndAppendLines({
    linkData,
    linkId,
    self
  });
}

function selectOperator(operatorId, self) {}

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
  self._deleteOperator(operatorId, true);
  self.createOperator(operatorId, operatorData);
  self.redrawLinksLayer();
  self.callbackEvent("afterChange", ["operator_data_change"]);
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
  self._refreshLinkPositions(linkId);
  self.uncolorizeLink(linkId);
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
  _drawLink
};
