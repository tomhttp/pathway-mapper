;
module.exports = (function(cy)
{
  "use strict";
  window.edgeAddingMode = false;
  var contextMenuSelectionColor = 'rgba(51, 247, 182, 0.88)';

  var lockedNodes = {};

  function isChildren(node, queryNode)
  {
    var parent = queryNode.parent()[0];
    while(parent)
    {
        if (parent.id() == node.id()) {
          return true;
        }
        parent = parent.parent()[0];
    }
    return false;
  }

  function removeNodes(nodes)
  {
    //Get removed edges first
    var removedEles = nodes.connectedEdges().remove();
    var children = nodes.children();

    if (children != null && children.length > 0)
    {
      children.forEach(function(childNode, i)
      {
            lockedNodes[childNode.id()] = true;
      });

      removedEles = removedEles.union(removeNodes(children));
    }

    removedEles = removedEles.union(nodes.remove());
    cy.nodes().updateCompoundBounds();
    return removedEles;
  }

  function changeParent(nodes, newParentId)
  {
    var removedNodes = removeNodes(nodes);

    for (var i = 0; i < removedNodes.length; i++)
    {
      var removedNode = removedNodes[i];
      var parentId = removedNode._private.data.parent;

      //Just alter the parent id of corresponding nodes !
      if (removedNode.isEdge() || lockedNodes[removedNode.id()])
      {
        continue;
      }

      removedNode._private.data.parent = newParentId;
      if(removedNode._private.parent){
        delete removedNode._private.parent;
      }
    }

    cy.add(removedNodes);
    cy.nodes().updateCompoundBounds();
  }

  cy.cxtmenu({
    selector: 'core',
    activeFillColor: contextMenuSelectionColor, // the colour used to indicate the selected command
    commands: [
      {
        content: 'perform layout',
        select: function(ele)
        {
          cy.layout({name:'cose-bilkent', padding: 50, animate: 'true'});
        }
      },
    ]
  });

  cy.cxtmenu({
    selector: 'node',
    activeFillColor: contextMenuSelectionColor, // the colour used to indicate the selected command
    commands:
    [
      {
        content: 'delete node(s)',
        select: function(ele)
        {
          cy.nodes(':selected').remove();
          ele.remove();
        }
      },
      // {
      //   content: '<span class="fa fa-star"></span> create compound',
      //   select: function(ele)
      //   {
      //     var selectedNodes = cy.nodes(':selected').size() > 0 ? cy.$(':selected') : ele;
      //     var compNode = cy.add({group: "nodes"})[0];
      //     var compId = compNode.id();
      //     selectedNodes.move({parent: compId});
      //   }
      // },
      {
        content: 'Add Selected Into This Node',
        select: function(ele)
        {
          var selectedNodes = cy.nodes(':selected');

          //Do nothing if node is not a compound or family node
          if (ele._private.data['type'] === 'GENE' || selectedNodes.size() < 1)
          {
            return;
          }
          else
          {

              var notValid = false;
              selectedNodes.forEach(function(tmpNode, i)
              {
                  if (ele.id() == tmpNode.id())
                  {
                    notValid = true;
                    return false;
                  }

                  if (tmpNode.isParent())
                  {
                    notValid = isChildren(tmpNode, ele);
                    if (notValid)
                    {
                        return false;
                    }
                  }
              });

              if (notValid)
              {
                  return;
              }
          }

          lockedNodes = {};
          var compId = ele.id();
          var selectedNodes = cy.nodes(':selected');
          changeParent(selectedNodes, compId);

        }
      }
    ]
  });

  cy.cxtmenu({
    selector: 'edge',
    activeFillColor: contextMenuSelectionColor, // the colour used to indicate the selected command
    commands: [
      {
        content: 'delete edge(s)',
        select: function(ele)
        {
          cy.edges(':selected').remove();
          ele.remove();
        }
      }
    ]
  });
}(window.cy));