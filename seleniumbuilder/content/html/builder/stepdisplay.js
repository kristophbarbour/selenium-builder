builder.stepdisplay = {};

builder.stepdisplay.state = {};
builder.stepdisplay.state.NO_CHANGE = -1;
builder.stepdisplay.state.NORMAL = 0;
builder.stepdisplay.state.RUNNING = 1;
builder.stepdisplay.state.SUCCEEDED = 2;
builder.stepdisplay.state.FAILED = 3;
builder.stepdisplay.state.ERROR = 4;
builder.stepdisplay.state.BREAKPOINT = 5;

builder.stepdisplay.stateColors = {};
builder.stepdisplay.stateColors[builder.stepdisplay.state.NORMAL] = 'white';
builder.stepdisplay.stateColors[builder.stepdisplay.state.RUNNING] = '#ffffaa';
builder.stepdisplay.stateColors[builder.stepdisplay.state.SUCCEEDED] = '#bfee85';
builder.stepdisplay.stateColors[builder.stepdisplay.state.FAILED] = '#ffcccc';
builder.stepdisplay.stateColors[builder.stepdisplay.state.ERROR] = '#ff3333';
builder.stepdisplay.stateColors[builder.stepdisplay.state.BREAKPOINT] = '#e0d5e9';

builder.registerPostLoadHook(function() {
  jQuery('#suite-saverequired').text(_t('suite_has_unsaved_changes'));
  jQuery('#suite-cannotsave-unsavedscripts').text(_t('suite_cannot_save_unsaved_scripts'));
  jQuery('#suite-cannotsave-notallsel1').text(_t('cannot_save_suite_due_to_mixed_versions'));
  jQuery('#edit-stop-local-playback').text(_t('stop_playback'));
  jQuery('#edit-stop-rc-playback').text(_t('stop_playback'));
  jQuery('#edit-continue-local-playback').text(_t('continue_playback'));
  jQuery('#edit-continue-rc-playback').text(_t('continue_playback'));
  jQuery('#edit-step-rc-playback').text(_t('step_playback'));
  jQuery('#edit-rc-stopping').text(_t('stopping'));
  jQuery('#edit-clearresults').text(_t('clear_results'));
  jQuery('#edit-rc-connecting-text').text(_t('connecting'));
  jQuery('#record-verify').text(_t('record_verification'));
  jQuery('#record-generic').text(_t('record_generic'));
  jQuery('#record-start-tx').text(_t('start_transaction'));
  jQuery('#record-stop-tx').text(_t('stop_transaction'));
  jQuery('#record-get-perf').text(_t('get_perf'));
  jQuery('#record-eval-js').text(_t('eval_js'));
  jQuery('#record-tx-name').attr('placeholder', _t('transaction_name'));
  jQuery('#record-stop-button').text(_t('stop_recording'));
  
  // Hide menus
  jQuery('body').click(function(e) {
    jQuery('.b-tasks').removeClass('b-tasks-appear');
    openMenuID = -1;
  });
  jQuery('html').click(function(e) {
    jQuery('.b-tasks').removeClass('b-tasks-appear');
    openMenuID = -1;
  });
});

var openMenuID = -1;
var reorderHandlerInstalled = false;

var SPECIAL_KEYS = [
    "NULL",
    "CANCEL",
    "HELP",
    "BACK_SPACE",
    "TAB",
    "CLEAR",
    "RETURN",
    "ENTER",
    "SHIFT",
    "LEFT_SHIFT",
    "CONTROL",
    "LEFT_CONTROL",
    "ALT",
    "LEFT_ALT",
    "PAUSE",
    "ESCAPE",
    "SPACE",
    "PAGE_UP",
    "PAGE_DOWN",
    "END",
    "HOME",
    "LEFT",
    "ARROW_LEFT",
    "UP",
    "ARROW_UP",
    "RIGHT",
    "ARROW_RIGHT",
    "DOWN",
    "ARROW_DOWN",
    "INSERT",
    "DELETE",
    "SEMICOLON",
    "EQUALS",
    "NUMPAD0",
    "NUMPAD1",
    "NUMPAD2",
    "NUMPAD3",
    "NUMPAD4",
    "NUMPAD5",
    "NUMPAD6",
    "NUMPAD7",
    "NUMPAD8",
    "NUMPAD9",
    "MULTIPLY",
    "ADD",
    "SEPARATOR",
    "SUBTRACT",
    "DECIMAL",
    "DIVIDE",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
    "META",
    "COMMAND",
    "ZENKAKU_HANKAKU"
];

builder.stepdisplay.specialKeysHelper = function(field_id) {
    var helper = newNode('span', {'class': 'specialKeysHelper', 'style': 'margin: 1em;'},
        newNode('span', {'click': function() {
            jQuery('#' + field_id + '-specialKeysHelper').show();
            jQuery('#' + field_id + '-specialKeysToggle').hide();
        }, 'style': 'cursor: pointer;', 'id': field_id + '-specialKeysToggle'}, _t('special_keys_on')),
        newNode('ul', {'id': field_id + '-specialKeysHelper', 'style': 'display: none; margin: 1em;'},
            newNode('span', {'click': function() {
                jQuery('#' + field_id + '-specialKeysHelper').hide();
                jQuery('#' + field_id + '-specialKeysToggle').show();
            }, 'style': 'cursor: pointer;'}, _t('special_keys_off'))
        )
    );
    jQuery('#' + field_id).after(helper);
    SPECIAL_KEYS.forEach(function(k) {
        jQuery('#' + field_id + '-specialKeysHelper').append(newNode('li', {
            'click': function() {
                var field = jQuery('#' + field_id)[0];
                var newText = field.value.substring(0, field.selectionStart) + '!{' + k + '}' + field.value.substring(field.selectionEnd);
                var newSelectionStart = field.selectionStart + ('!{' + k + '}').length;
                jQuery('#' + field_id).val(newText);
                field.selectionStart = newSelectionStart;
                field.selectionEnd = newSelectionStart;
            },
            'style': 'cursor: pointer;'
        }, k));
    });
};

function esc(txt) {
  txt = JSON.stringify(txt);
  return txt.substring(1, txt.length - 1);
}

function deesc(txt) {
  try {
    return JSON.parse("\"" + txt + "\"");
  } catch (e) {
    return txt;
  }
}

/** Functions for displaying Selenium 2 steps. */
builder.stepdisplay.clearDisplay = function() {
  jQuery("#steps").empty();
  jQuery('#recordingSuite0').empty();
};

builder.stepdisplay.updateStepPlaybackState = function(run, script, step, stepIndex, state, message, error, percentProgress) {
  if (script != builder.getScript()) { return; } // This script isn't visible.
  var id = step.id;
  if (state != builder.stepdisplay.state.NO_CHANGE) {
    jQuery("#" + id + '-content').css('background-color', builder.stepdisplay.stateColors[state]);
  }
  if (message) {
    jQuery("#" + id + "-message").html(message).show();
  }
  if (error) {
    jQuery("#" + id + "-error").html(error).show();
  }
  if (percentProgress && percentProgress > 0) {
    builder.stepdisplay.setProgressBar(id, percentProgress);
  } else {
    builder.stepdisplay.hideProgressBar(id);
  }
  step.outcome = state;
  step.runmessage = message;
  step.failureMessage = error;
};

builder.stepdisplay.update = function() {
  if (!reorderHandlerInstalled) {
    // Make steps sortable by dragging.
    jQuery('#steps').sortable({
      items: ".b-step",
      axis: "y",
      update: function(evt, ui) {
        var script = builder.getScript();
        var reorderedSteps = jQuery('#steps .b-step').get();
        var reorderedIDs = [];
        for (var i = 0; i < reorderedSteps.length; i++) {
          // Filter out elements that aren't actually steps. (?)
          if (script.getStepIndexForID(reorderedSteps[i].id) != -1) {
            reorderedIDs.push(reorderedSteps[i].id);
          }
        }
        script.reorderSteps(reorderedIDs);
        // Then relabel them.
        for (var i = 0; i < script.steps.length; i++) {
          var step = script.steps[i];
          jQuery('#' + step.id + '-name').html(step.step_name || (i + 1) + ".");
        }
      }
    });
    reorderHandlerInstalled = true;
  }
  builder.stepdisplay.clearDisplay();
  var script = builder.getScript();
  var saveRequired = script.saveRequired;
  for (var i = 0; i < script.steps.length; i++) {
    addStep(script.steps[i]);
  }
  builder.suite.setScriptSaveRequired(script, saveRequired);
};

builder.stepdisplay.updateStep = function(stepID) {
  var script = builder.getScript();
  var step = script.getStepWithID(stepID);
  var paramNames = step.getParamNames();
  if (step.negated) {
    jQuery('#' + stepID + '-type').text(_t('not') + " " + builder.translate.translateStepName(step.type.getName()));
  } else {
    jQuery('#' + stepID + '-type').text(builder.translate.translateStepName(step.type.getName()));
  }
  if (script.seleniumVersion.playback.canPlayback(step.type)) {
    jQuery('#' + stepID + '-unplayable').hide();
  } else {
    jQuery('#' + stepID + '-unplayable').show();
  }
  clearEditParamTasks(stepID);
  clearParameterFields(stepID);
  for (var i = 0; i < paramNames.length; i++) {
    addEditParamTask(stepID, i, _t('edit_p', builder.translate.translateParamName(paramNames[i], step.type.getName())));
    
    var paramValue = "?";
    if (step.type.getParamType(paramNames[i]) == "locator") {
      paramValue = step[paramNames[i]].getName(script.seleniumVersion) + ": " + step[paramNames[i]].getValue();
    } else {
      paramValue = esc(step[paramNames[i]]);
    }
    
    addParameterField(stepID, i, builder.translate.translateParamName(paramNames[i], step.type.getName()), paramValue);
    
    if (paramNames.length > 1) {
      jQuery('#' + stepID + '-p' + i).css("display", "block");
    } else {
      jQuery('#' + stepID + '-p' + i).css("display", "inline");
    }
    if (paramNames.length > 1 || step[paramNames[i]] == "") {
      jQuery('#' + stepID + '-p' + i + '-name').show();
    } else {
      jQuery('#' + stepID + '-p' + i + '-name').hide();
    }
  }
  
  if (step.type.getNote()) {
    jQuery('#' + stepID + '-note').show().html(step.type.getNote());
  } else {
    jQuery('#' + stepID + '-note').hide();
  }
  
  // Set the playback status info
  jQuery('#' + step.id + '-content').css('background-color', 'white');
  jQuery('#' + step.id + '-error').hide();
  jQuery('#' + step.id + '-message').hide();
  if (builder.stepdisplay.stateColors[step.outcome]) {
    jQuery("#" + step.id + '-content').css('background-color', builder.stepdisplay.stateColors[step.outcome]);
  }
  if (step.runmessage) {
    jQuery("#" + step.id + "-message").show().html(step.runmessage);
  }
  if (step.failureMessage) {
    jQuery("#" + step.id + "-error").show().html(step.failureMessage);
  }
  
  // Show whether it's the insertion point for recording.
  var stepIndex = script.getStepIndexForID(stepID);
  if (builder.record.recording && stepIndex == builder.record.insertionIndex) {
    jQuery("#" + step.id + "-content").addClass('b-recording-insertion-point-top');
  } else {
    jQuery("#" + step.id + "-content").removeClass('b-recording-insertion-point-top');
  }
  if (builder.record.recording && builder.record.insertionIndex >= script.steps.length && step == script.steps[script.steps.length - 1]) {
    jQuery("#" + step.id + "-content").addClass('b-recording-insertion-point-bottom');
  } else {
    jQuery("#" + step.id + "-content").removeClass('b-recording-insertion-point-bottom');
  }
};

builder.stepdisplay.showProgressBar = function(stepID) {
  jQuery('#' + stepID + '-progress-done').show();
  jQuery('#' + stepID + '-progress-notdone').show();
};

builder.stepdisplay.hideProgressBar = function(stepID) {
  jQuery('#' + stepID + '-progress-done').hide();
  jQuery('#' + stepID + '-progress-notdone').hide();
};

builder.stepdisplay.setProgressBar = function(stepID, percent) {
  jQuery('#' + stepID + '-progress-done').css('width', percent);
  jQuery('#' + stepID + '-progress-notdone').css('left', percent).css('width', 100 - percent);
  builder.stepdisplay.showProgressBar(stepID);
};

builder.stepdisplay.addNewStep = function() {
  var script = builder.getScript();
  var newStep = new builder.Step(script.seleniumVersion.defaultStepType);
  script.addStep(newStep);
  addStep(newStep);
  builder.suite.setCurrentScriptSaveRequired(true);
  return newStep.id;
};

function addNewStepBefore(beforeStepID) {
  var id = builder.stepdisplay.addNewStep();
  var beforeStepDOM = jQuery('#' + beforeStepID)[0];
  var newStepDOM = jQuery("#" + id)[0];
  newStepDOM.parentNode.removeChild(newStepDOM);
  beforeStepDOM.parentNode.insertBefore(newStepDOM, beforeStepDOM);
  builder.getScript().moveStepToBefore(id, beforeStepID);
  builder.suite.setCurrentScriptSaveRequired(true);
}

function addNewStepAfter(afterStepID) {
  var id = builder.stepdisplay.addNewStep();
  var afterStep = jQuery('#' + afterStepID);
  var newStepDOM = jQuery("#" + id)[0];
  newStepDOM.parentNode.removeChild(newStepDOM);
  afterStep.after(newStepDOM);
  builder.getScript().moveStepToAfter(id, afterStepID);
  builder.suite.setCurrentScriptSaveRequired(true);
}

function copyStep(stepID) {
  sebuilder.setClipboardString(JSON.stringify(builder.getScript().getStepWithID(stepID).toJSON()));
}

function cutStep(stepID) {
  copyStep(stepID);
  deleteStep(stepID);
}

function pasteStep(afterStepID) {
  var text = sebuilder.getClipboardString();
  if (!text) { return; }
  var script = builder.getScript();
  var newStep = builder.stepFromJSON(JSON.parse(text), script.seleniumVersion);
  script.addStep(newStep);
  addStep(newStep);
  var id = newStep.id;
  var afterStep = jQuery('#' + afterStepID);
  var newStepDOM = jQuery("#" + id)[0];
  newStepDOM.parentNode.removeChild(newStepDOM);
  afterStep.after(newStepDOM);
  builder.getScript().moveStepToAfter(id, afterStepID);
  builder.suite.setCurrentScriptSaveRequired(true);
}

function deleteStep(stepID) {
  if (builder.getScript().steps.length < 2) { return; }
  builder.getScript().removeStepWithID(stepID);
  jQuery('#' + stepID).remove();
  builder.suite.setCurrentScriptSaveRequired(true);
  appearingID = -1; // If there was a menu open, pave the way for a different one to open instead.
}

function toggleBreakpoint(stepID) {
  var bp = builder.getScript().getStepWithID(stepID).breakpoint;
  if (bp) {
    jQuery('#' + stepID + '-breakpoint').removeClass('b-step-breakpoint-set b-step-breakpoint-disabled')
    jQuery('#' + stepID + 'toggle-breakpoint').text(_t('step_add_breakpoint'));
    builder.getScript().getStepWithID(stepID).breakpoint = false;
  } else {
    if (builder.breakpointsEnabled) {
      jQuery('#' + stepID + '-breakpoint').addClass('b-step-breakpoint-set');
    } else {
      jQuery('#' + stepID + '-breakpoint').addClass('b-step-breakpoint-disabled');
    }
    jQuery('#' + stepID + 'toggle-breakpoint').text(_t('step_remove_breakpoint'));
    builder.getScript().getStepWithID(stepID).breakpoint = true;
  }
}

builder.stepdisplay.clearAllBreakpoints = function() {
  var script = builder.getScript();
  for (var i = 0; i < script.steps.length; i++) {
    var step = script.steps[i];
    jQuery('#' + step.id + '-breakpoint').hide();
    jQuery('#' + step.id + 'toggle-breakpoint').text(_t('step_add_breakpoint'));
    step.breakpoint = false;
  }
};

var searchers = [];
var hasSearchers = false;
var searcherInterval = null;
var wasRecording = false;

function toggleSearchers(stepID, pIndex) {
  if (hasSearchers) { stopSearchers(stepID, pIndex); } else { startSearchers(stepID, pIndex); }
}

function stopSearchers(stepID, pIndex) {
  if (searcherInterval) {
    clearInterval(searcherInterval);
  }
  for (var i = 0; i < searchers.length; i++) {
    searchers[i].destroy();
  }
  searchers = [];
  hasSearchers = false;
  if (wasRecording) {
    builder.record.continueRecording(/* insert index */ builder.getScript().steps.length);
  }
}

function startSearchers(stepID, pIndex) {
  wasRecording = builder.record.recording;
  if (builder.record.recording) {
    builder.record.stop();
  }
  hasSearchers = true;
  attachSearchers(stepID, pIndex, true);
  // Keep on looking for new frames with no attached searchers.
  searcherInterval = setInterval(function() { attachSearchers(stepID, pIndex); }, 500, true);
  window.sebuilder.focusRecordingTab();
}

/**
 * Attach a VerifyExplorer to each frame in Firefox to allow the user to select a new locator.
 * The code also attaches a boolean to the frames to prevent attaching multiple searchers, but
 * since this can't be easily cleared when searching is complete, it can be overridden with the
 * force parameter.
 */
function attachSearchers(stepID, pIndex, force) {
  var script = builder.getScript();
  // To do this, we first must iterate over the windows in the browser - but of course
  // each window may contain multiple tabs!
  var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
  var en = windowManager.getEnumerator(null, false);
  while (en.hasMoreElements()) {
    var w = en.getNext();
    for (var i = 0; i < w.frames.length; i++) {
      // This expression filters out the frames that aren't browser tabs.
      // I'm sure there's a better way to detect this, but this would require meaningful
      // documentation in Firefox! qqDPS
      if ((w.frames[i] + "").indexOf("ChromeWindow") == -1) {
        var frame = w.frames[i];
        // Don't attach to the recording window, lest confusion reign.
        if (frame == window) {
          continue;
        }
        // Prevent multiple attached searchers unless force is true.
        if (frame._selenium_builder_hasSearcher && !force) {
          continue;
        }
        frame._selenium_builder_hasSearcher = true;
        
        searchers.push(new builder.VerifyExplorer(
          frame,
          script.seleniumVersion,
          // This function is called when the user selects a new element.
          function(locator) {
            var originalStep = builder.getScript().getStepWithID(stepID);
            originalStep[originalStep.getParamNames()[pIndex]] = locator;
            // Don't immediately stop searchers: this would cause the listener that prevents the
            // click from actually activating the selected element to be detached prematurely.
            setTimeout(stopSearchers, 1);
            window.sebuilder.focusRecorderWindow();
            builder.stepdisplay.updateStep(stepID);
            builder.suite.setCurrentScriptSaveRequired(true);
            // Update the edit-param view.
            jQuery('#' + stepID + '-p' + pIndex + '-edit-div').remove();
            jQuery('#' + stepID + '-p' + pIndex).show();
            editParam(stepID, pIndex);
          },
          /* justReturnLocator */ true
        ));
      }
    }
  }
}


function updateTypeDivs(stepID, newType) {
  var script = builder.getScript();
  if (newType.getNegatable()) {
    jQuery('#' + stepID + '-edit-negate').show();
    jQuery('#' + stepID + '-edit-negate-label').show();
  } else {
    jQuery('#' + stepID + '-edit-negate').hide();
    jQuery('#' + stepID + '-edit-negate-label').hide();
  }
  jQuery('#' + stepID + '-type-info').html(getTypeInfo(newType));
  var cD = jQuery('#' + stepID + '-edit-cat-list');
  var tD = jQuery('#' + stepID + '-edit-type-list');
  //cD.attr('__sb-stepType', newType);
  cD[0].__sb_stepType = newType;
  cD.html('');
  tD.html('');
  for (var i = 0; i < script.seleniumVersion.categories.length; i++) {
    var inCat = false;
    for (var j = 0; j < script.seleniumVersion.categories[i][1].length; j++) {
      if (script.seleniumVersion.categories[i][1][j] == newType) {
        inCat = true;
      }
    }
    if (inCat) {
      cD.append(newNode('li', newNode(
        'span',
        script.seleniumVersion.categories[i][0],
        {
          class: 'selected-cat'
        }
      )));
      for (var j = 0; j < script.seleniumVersion.categories[i][1].length; j++) {
        if (script.seleniumVersion.categories[i][1][j] == newType) {
          tD.append(newNode('li', newNode(
            'span',
            builder.translate.translateStepName(script.seleniumVersion.categories[i][1][j].getName()),
            {
              class: 'selected-type'
            }
          )));
        } else {
          tD.append(newNode('li', newNode(
            'a',
            builder.translate.translateStepName(script.seleniumVersion.categories[i][1][j].getName()),
            {
              class: 'not-selected-type',
              click: mkUpdate(stepID, script.seleniumVersion.categories[i][1][j])
            }
          )));
        }
      }
    } else {
      cD.append(newNode('li', newNode(
        'a',
        script.seleniumVersion.categories[i][0],
        {
          class: 'not-selected-cat',
          click: mkCatUpdate(stepID, script.seleniumVersion.categories[i][1])
        }
      )));
    }
  }  
}

function mkUpdate(stepID, newType) {
  return function() {
    //jQuery('#' + stepID + '-type-search').val('');
    jQuery('#' + stepID + '-cat-table').show();
    jQuery('#' + stepID + '-results-list').hide();
    updateTypeDivs(stepID, newType);
  };
}

function baseTypeName(type) {
  return type.getName().replace(/^(store|assert|verify|waitFor)/, "");
}

function mkCatUpdate(stepID, newCat) {
  return function() {
    // Miau!
    var newType = newCat[0];
    var oldType = jQuery('#' + stepID + '-edit-cat-list')[0].__sb_stepType;
    if (oldType) {
      var baseName = baseTypeName(oldType);
      var related = newCat.filter(function(type) {
        return baseTypeName(type) == baseName;
      });
      if (related.length > 0) {
        newType = related[0];
      }
    }
    updateTypeDivs(stepID, newType);
  };
}

function getTypeInfo(type) {
  var script = builder.getScript();
  var paramInfo = "";
  var longParamInfo = newNode('ul', {class: 'type-info-longparam'});
  var pNames = type.getParamNames();
  for (var i = 0; i < pNames.length; i++) {
    paramInfo += pNames[i];
    if (i != pNames.length - 1) {
      paramInfo += ", ";
    }
    var doc = builder.translate.translateParamDoc(script.seleniumVersion.shortName, type.getName(), pNames[i], script.seleniumVersion.docs[type.getName()].params[pNames[i]]);
    jQuery(longParamInfo).append(newNode('li',
      newNode('b', builder.translate.translateParamName(pNames[i], type.getName())), ": " + doc));
  }
  if (pNames.length > 0) { paramInfo = " (" + paramInfo + ")"; }
    
  var body = newNode('div', {class: 'type-info-body'});
  var doc = builder.translate.translateStepDoc(script.seleniumVersion.shortName, type.getName(), script.seleniumVersion.docs[type.getName()].description);
  jQuery(body).html(doc);
  jQuery(body).append(_t('param_expr_info'));
  
  return newNode(
    'div',
    { class: 'type-info' },
    newNode('div', {class: 'type-info-head'}, builder.translate.translateStepName(type.getName()) + paramInfo),
    longParamInfo,
    body
  );
}

function editType(stepID) {
  if (jQuery('#' + stepID + '-edit-div').length > 0) {
    return;
  }
  var step = builder.getScript().getStepWithID(stepID);
  
  var catL = newNode(
    'ul',
    {
      id: stepID + '-edit-cat-list',
      class: 'cat-list'
    }
  );
  var typeL = newNode(
    'ul',
    {
      id: stepID + '-edit-type-list',
      class: 'type-list'
    }
  );
  
  var editDiv = newNode(
    'div',
    {
      id: stepID + '-edit-div',
      style: 'margin-bottom: 5px;'
    },
    newNode('div', newNode('input', { type: 'text', id: stepID + '-type-search', 'placeholder': _t('search')})),
    newNode('table', { 'class': 'cat-table', cellpadding: '0', cellspacing: '0', 'id': stepID + '-cat-table' }, newNode('tr',
      newNode('td', catL),
      newNode('td', typeL),
      newNode('td', { id: stepID + '-type-info' })
    )),
    newNode('ul', { 'class': 'results-list', 'style': 'display: none;', 'id': stepID + '-results-list' }),
    newNode(
      'input',
      {
        id: stepID + '-edit-negate',
        type: 'checkbox',
        style: 'display: none;'
      }
    ),
    newNode(
      'span',
      " " + _t('negate_assertion_or_verification'),
      {
        id: stepID + '-edit-negate-label',
        style: 'display: none;'
      }
    ),
    newNode('p'),
    newNode('a', _t('ok'), {
      class: 'button',
      click: function (e) {
        confirmTypeSelection(stepID);
      }
    })
  );
  
  jQuery('#' + stepID + '-type').after(editDiv);
  if (step.negated) {
    jQuery('#' + stepID + '-edit-negate').prop('checked', 'checked');
  }
  jQuery('#' + stepID + '-type').hide();
  updateTypeDivs(stepID, step.type);
  jQuery('#' + stepID + '-type-search').focus();
  jQuery('#' + stepID + '-type-search').keyup(function(e) {
    if (e.which == 13) {
      selectFirstSearchResult(stepID);
    } else {
      doSearch(stepID)
    }
  });
}

function confirmTypeSelection(stepID) {
  var step = builder.getScript().getStepWithID(stepID);
  var type = jQuery('#' + stepID + '-edit-cat-list')[0].__sb_stepType;
  if (type) {
    step.changeType(type);
    step.negated = step.type.getNegatable() && !!(jQuery('#' + stepID + '-edit-negate').prop('checked'));
  }
  jQuery('#' + stepID + '-edit-div').remove();
  jQuery('#' + stepID + '-type').show();
  builder.stepdisplay.updateStep(stepID);
  builder.suite.setCurrentScriptSaveRequired(true);
}

function selectFirstSearchResult(stepID) {
  var query = jQuery('#' + stepID + '-type-search').val().trim();
  if (query) {
    jQuery('#' + stepID + '-cat-table').hide();
    jQuery('#' + stepID + '-results-list').show().html('');
    var script = builder.getScript();
    for (var i = 0; i < script.seleniumVersion.categories.length; i++) {
      for (var j = 0; j < script.seleniumVersion.categories[i][1].length; j++) {
        var stepType = script.seleniumVersion.categories[i][1][j];
        var stepTypeName = stepType.getName();
        if (stepTypeName.toLowerCase().indexOf(query) != -1) {
          //jQuery('#' + stepID + '-type-search').val('');
          mkUpdate(stepID, stepType)();
          confirmTypeSelection(stepID);
          return;
        }
      }
    }
  }
}

function doSearch(stepID) {
  var query = jQuery('#' + stepID + '-type-search').val().trim();
  if (query) {
    jQuery('#' + stepID + '-cat-table').hide();
    jQuery('#' + stepID + '-results-list').show().html('');
    var script = builder.getScript();
    for (var i = 0; i < script.seleniumVersion.categories.length; i++) {
      for (var j = 0; j < script.seleniumVersion.categories[i][1].length; j++) {
        var stepType = script.seleniumVersion.categories[i][1][j];
        var stepTypeName = stepType.getName();
        if (stepTypeName.toLowerCase().indexOf(query) != -1) {
          jQuery('#' + stepID + '-results-list').append(newNode('li', newNode('a', { 'click': mkUpdate(stepID, stepType) }, stepTypeName)));
        }
      }
    }
  } else {
    jQuery('#' + stepID + '-cat-table').show();
    jQuery('#' + stepID + '-results-list').hide();
  }
}

function editParam(stepID, pIndex) {
  if (jQuery('#' + stepID + '-p' + pIndex + '-edit-div').length > 0) {
    return;
  }
  var script = builder.getScript();
  var step = script.getStepWithID(stepID);
  var pName = step.getParamNames()[pIndex];
  if (step.type.getParamType(pName) == "locator") {
    var tdd_id = stepID + '-p' + pIndex + '-locator-type-chooser';
    var typeDropDown = newNode(
      'select',
      {
        id: tdd_id
      }
    );
    
    function okf() {
      builder.locator.deHighlight(function() {});
      var locMethodName = jQuery('#' + tdd_id).val();
      var locMethod = builder.locator.methodForName(script.seleniumVersion, locMethodName);
      if (locMethod) {
        step[pName].preferredMethod = locMethod;
        step[pName].preferredAlternative = jQuery('#' + stepID + '-p' + pIndex + '-edit-input').data('alt') || 0;
        if (!step[pName].values[step[pName].preferredMethod] || step[pName].values[step[pName].preferredMethod].length == 0)
        {
          step[pName].preferredAlternative = 0;
          step[pName].values[locMethod] = [jQuery('#' + stepID + '-p' + pIndex + '-edit-input').val()];
        } else {
          if (step[pName].preferredAlternative >= step[pName].values[step[pName].preferredMethod].length) {
            step[pName].preferredAlternative = 0;
          }
          step[pName].values[locMethod][step[pName].preferredAlternative] = jQuery('#' + stepID + '-p' + pIndex + '-edit-input').val();
        }
      }
      jQuery('#' + stepID + '-p' + pIndex + '-edit-div').remove();
      jQuery('#' + stepID + '-p' + pIndex).show();
      builder.stepdisplay.updateStep(stepID);
      builder.suite.setCurrentScriptSaveRequired(true);
    }
    
    var editDiv = newNode(
      'div',
      {
        id: stepID + '-p' + pIndex + '-edit-div'
      },
      typeDropDown,
      ": ",
      newNode('input', {id: stepID + '-p' + pIndex + '-edit-input', type:'text', value: step[pName].getValue()}),
      newNode('a', _t('ok'), {
        id: stepID + '-p' + pIndex + '-OK',
        class: 'button',
        click: function (e) { okf(); }
      }),
      newNode('a', _t('find'), {
        id: stepID + '-p' + pIndex + '-find',
        class: 'button',
        click: function (e) {
          var locMethodName = jQuery('#' + tdd_id).val();
          var locMethod = builder.locator.methodForName(script.seleniumVersion, locMethodName);
          if (locMethod) {
            builder.locator.highlight(locMethod, jQuery('#' + stepID + '-p' + pIndex + '-edit-input').val());
          }
        }
      }),
      newNode('div',
        newNode('a', _t('find_a_different_target'), {
          click: function() { toggleSearchers(stepID, pIndex); }
        })
      )
    );
    
    for (var k in builder.locator.methods) {
      var lMethod = builder.locator.methods[k];
      if (!lMethod[script.seleniumVersion]) { continue; }
      if (lMethod == step[pName].preferredMethod) {
        jQuery(typeDropDown).append(newNode(
          'option', lMethod[script.seleniumVersion], { selected: "true" }
        ));
      } else {
        jQuery(typeDropDown).append(newNode(
          'option', lMethod[script.seleniumVersion]
        ));
      }
    }
        
    var alternativesList = newNode(
      'ul',
      {
        id: stepID + '-p' + pIndex + '-alternatives-list',
        class: 'b-alternatives'
      }
    );
    var alternativesDiv = newNode(
      'div',
      {
        id: stepID + '-p' + pIndex + '-alternatives-div'
      },
      newNode('p', _t('suggested_locator_alternatives')),
      alternativesList
    );
    
    var hasAlts = false;
    for (var altMethod in step[pName].values) {
      if (!step[pName].values[altMethod].length) { continue; }
      if (altMethod != step[pName].preferredMethod || step[pName].values[altMethod].length > 1) {
        hasAlts = true;
        for (var i = 0; i < step[pName].values[altMethod].length; i++) {
          jQuery(alternativesList).append(createAltItem(step, pIndex, pName, builder.locator.methods[altMethod][script.seleniumVersion], step[pName].values[altMethod][i], i));
        }
      }
    }
    
    if (hasAlts) {
      jQuery(editDiv).append(alternativesDiv);
    }
    
    jQuery('#' + stepID + '-p' + pIndex).after(editDiv);
    jQuery('#' + stepID + '-p' + pIndex).hide();
    jQuery('#' + stepID + '-p' + pIndex + '-edit-input').focus().select().keypress(function (e) {
      if (e.which == 13) {
        okf();
      }
    });
  } else {
    function okf() {
      step[pName] = deesc(jQuery('#' + stepID + '-p' + pIndex + '-edit-input').val());
      jQuery('#' + stepID + '-p' + pIndex + '-edit-div').remove();
      jQuery('#' + stepID + '-p' + pIndex).show();
      builder.stepdisplay.updateStep(stepID);
      builder.suite.setCurrentScriptSaveRequired(true);
    }
    
    var editDiv = newNode(
      'div',
      {
        id: stepID + '-p' + pIndex + '-edit-div'
      },
      newNode('input', {id: stepID + '-p' + pIndex + '-edit-input', type:'text', value: esc(step[pName])}),
      newNode('a', "OK", {
        id: stepID + '-p' + pIndex + '-OK',
        class: 'button',
        click: function (e) { okf(); }
      })
    );
    
    jQuery('#' + stepID + '-p' + pIndex).after(editDiv);
    jQuery('#' + stepID + '-p' + pIndex).hide();
    builder.stepdisplay.specialKeysHelper(stepID + '-p' + pIndex + '-edit-input');
    jQuery('#' + stepID + '-p' + pIndex + '-edit-input').focus().select().keypress(function (e) {
      if (e.which == 13) {
        okf();
      }
    });
  }
}

/** Creates list item for alternative locator. */
function createAltItem(step, pIndex, pName, altName, altValue, altIndex) {
  return newNode(
    'li',
    newNode(
      'a',
      altName + ": " + altValue,
      {
        click: function(e) {
          jQuery('#' + step.id + '-p' + pIndex + '-locator-type-chooser').val(altName);
          jQuery('#' + step.id + '-p' + pIndex + '-edit-input').val(altValue);
          jQuery('#' + step.id + '-p' + pIndex + '-edit-input').data('alt', altIndex);
        }
      }
    )
  );
}

function editStepName(stepID) {
  jQuery('#' + stepID + '-name').hide();
  jQuery('#' + stepID + '-name-edit').show();
  jQuery('#' + stepID + '-name-edit-field').
    val(jQuery('#' + stepID + '-name').html()).
    attr("placeholder", (builder.getScript().getStepIndexForID(stepID) + 1) + ".").
    focus().select();
}

function saveStepName(stepID) {
  jQuery('#' + stepID + '-name-edit').hide();
  var n = jQuery('#' + stepID + '-name-edit-field').val();
  var script = builder.getScript();
  var step = script.getStepWithID(stepID);
  step.step_name = n == "" ? null : n;
  jQuery('#' + stepID + '-name').html(n == "" ? (script.steps.indexOf(step) + 1) + "." : n).show();
}

function clearEditParamTasks(stepID) {
  jQuery('#' + stepID + '-b-tasks-params').html('');
}

function addEditParamTask(stepID, paramIndex, paramName) {
  jQuery('#' + stepID + '-b-tasks-params').append(newNode(
    'a',
    paramName,
    {
      'id': stepID + 'edit-p' + paramIndex,
      'class': 'b-task',
      'click': function() { editParam(stepID, paramIndex); }
    }
  ));
}

function clearParameterFields(stepID) {
  jQuery('#' + stepID + '-container-params').html('');
}

function addParameterField(stepID, paramIndex, paramName, paramValue) {
  jQuery('#' + stepID + '-container-params').append(newNode('span', {'id': stepID + '-p' + paramIndex},
    newNode('a', paramName, {
      'id': stepID + '-p' + paramIndex + '-name',
      'class': 'b-param-type',
      'click': function() { editParam(stepID, paramIndex); }
    }),
    newNode('a', paramValue, {
      'id': stepID + '-p' + paramIndex + '-value',
      'class': 'b-param',
      'click': function() { editParam(stepID, paramIndex); }
    })
  ));
}

/** Adds the given step to the GUI. */
function addStep(step) {
  var script = builder.getScript();
  var stepName = step.step_name || (script.steps.indexOf(step) + 1) + ".";
  jQuery("#steps").append(
    newNode('div', {'id': step.id, 'class': 'b-step'},
      newNode('span', {'id': step.id + '-b-tasks', 'class': 'b-tasks'}),
      newNode('div', {'class': 'b-step-content', 'id': step.id + '-content'},
        newNode('div', {'class': 'b-step-container', 'id': step.id + '-container'})
      )
    )
  );
  
  var addTask = function(content, idPart, onClick) {
    jQuery('#' + step.id + '-b-tasks').append(newNode(
      'a',
      content,
      {
        'id': step.id + idPart,
        'class': 'b-task',
        'click': onClick
      }
    ));
  };
  
  addTask(_t('step_edit_type'), 'edit', function() { editType(step.id); return false; });
  jQuery('#' + step.id + '-b-tasks').append(newNode(
    'span', '', {'id': step.id + '-b-tasks-params'}
  ));
  addTask(_t('step_delete'), 'delete', function() { deleteStep(step.id); });
  addTask(_t('step_new_above'), 'insert-above', function() { addNewStepBefore(step.id); });
  addTask(_t('step_new_below'), 'insert-below', function() { addNewStepAfter(step.id); });
  addTask(_t('step_copy'), 'copy', function() { copyStep(step.id); });
  addTask(_t('step_cut'), 'cut', function() { cutStep(step.id); });
  addTask(_t('step_paste'), 'paste', function() { pasteStep(step.id); });
  addTask(_t('step_record_before'), 'record_before', function() {
    builder.record.continueRecording(builder.getScript().getStepIndexForID(step.id));
  });
  addTask(_t('step_record_after'), 'record_after', function() {
    builder.record.continueRecording(builder.getScript().getStepIndexForID(step.id) + 1);
  });
  addTask(_t('step_run_to_here'), 'run-to-here', function() {
    step.tempBreakpoint = true;
    builder.record.stopAll();
    builder.dialogs.rc.show(jQuery("#dialog-attachment-point"), /*play all*/ false);
  });
  addTask(step.breakpoint ? _t('step_remove_breakpoint') : _t('step_add_breakpoint'), 'toggle-breakpoint', function() {
    toggleBreakpoint(step.id);
  });
  
  var addContent = function(content) {
    jQuery('#' + step.id + '-container').append(content);
  };
  
  // Menu hamburger
  addContent(newNode('span', {'id': step.id + '-burger', 'class': 'b-burger'}, ' '));

  // The breakpoint marker
  addContent(newNode('span', {
      'id': step.id + '-breakpoint', 
      'class': 'b-step-breakpoint' + 
              (step.breakpoint && builder.breakpointsEnabled ? ' b-step-breakpoint-set' : '') +
              (step.breakpoint && !builder.breakpointsEnabled ? ' b-step-breakpoint-disabled' : ''),
      'dblclick': function () { toggleBreakpoint(step.id); }
  }));

  // The step name
  addContent(newNode('span', {'class':'b-step-name', 'id': step.id + '-name', 'click': function() { editStepName(step.id); }}, stepName));
  
  // Edit name
  addContent(newNode('span', {'id': step.id + '-name-edit', 'style': 'display: none;'},
    newNode('input', {'id': step.id + '-name-edit-field', 'type': 'text', 'keyup': function(e) {
      if (e.which == 13) {
        saveStepName(step.id);
      }
    }}),
    " ",
    newNode('a', _t('ok'), {
      'id': step.id + '-name-edit-ok',
      'class': 'button',
      'click': function () { saveStepName(step.id); }
    })
  ));

  // The type
  addContent(newNode('a', step.type, {
    'id': step.id + '-type',
    'class':'b-method',
    'click': function() { editType(step.id); }
  }));
  
  // Params go here
  addContent(newNode('span', {'id': step.id + '-container-params'}));

  // Message display
  addContent(newNode('div', {'class': "b-step-note", 'id': step.id + '-note', 'style':'display: none'}));
  addContent(newNode('div', {'style':"width: 100px; height: 3px; background: #333333; display: none", 'id': step.id + "-progress-done"}));
  addContent(newNode('div', {'style':"width: 0px; height: 3px; background: #bbbbbb; position: relative; top: -3px; left: 100px; display: none", 'id': step.id + "-progress-notdone"}));
  addContent(newNode('div', {'class': "b-step-message", 'id': step.id + "-message", 'style':'display: none'}));
  addContent(newNode('div', {'class': "b-step-error", 'id': step.id + "-error", 'style':'display: none'}));
  addContent(newNode('div', _t('playback_not_supported_warning'), {'class': "b-step-error", 'id': step.id + "-unplayable", 'style':'display: none'}));
  
  jQuery('#' + step.id + '-burger').click(function(e) {
    jQuery('.b-tasks').removeClass('b-tasks-appear');
    if (openMenuID != step.id) {
      jQuery('#' + step.id + '-b-tasks').addClass('b-tasks-appear');
      openMenuID = step.id;
    } else {
      openMenuID = -1;
    }

    e.stopPropagation();
  });
  
  jQuery('#' + step.id + '-breakpoint').click(function(e) { 
    toggleBreakpoint(step.id);    
    e.stopPropagation();
  });

  builder.stepdisplay.updateStep(step.id);
  builder.suite.setCurrentScriptSaveRequired(true);
}



if (builder && builder.loader && builder.loader.loadNextMainScript) { builder.loader.loadNextMainScript(); }
