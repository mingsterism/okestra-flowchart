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

function addOperator(addOperatorObject) {
  const {
    data,
    operatorNum,
    createOperator,
    addLink,
    operatorData
  } = addOperatorObject;

  while (typeof data.operators[operatorNum] != "undefined") {
    operatorNum++; //Create the id of operator
  }

  createOperator(operatorNum, operatorData); //Put the operatorData into the JSON object which is accessible through data.operators

  //Automatically popups of the Approve and Reject Operator
  var isItRejectNode = operatorData.properties.title === "Reject";

  if (isItRejectNode) {
    let approveNum, rejectNum, motherNum;
    let r = operatorData.properties.random;
    let operators = data.operators;
    let isApproveNodeAndSameMother =
      operators[key].properties.random == r &&
      operators[key].properties.title === "Approve";
    let isMotherNode =
      operators[key].properties.random === r &&
      operators[key].properties.title != "Approve" &&
      operators[key].properties.title != "Reject";

    for (var key in operators) {
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
      })
    );

    addLink(
      createLinkData({
        fromOperator: motherNum,
        fromConnector: "output_1",
        toOperator: operatorNum,
        toConnector: "input_0"
      })
    );
    return operatorNum;
  }
}

module.exports = {
  addOperator
};
