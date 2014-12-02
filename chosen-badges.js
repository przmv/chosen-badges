(function ($, window, document, undefined) {

  'use strict';

  var pluginName = 'chosenBadges';
  var Plugin = function (element, options) {

    // Default settings
    var _defaults = {
      // Value callback/value
      value: function (v) {
        return v;
      },
      // Numbering bange widget.
      // Possible values:
      // false - disable numbering widget,
      // true - enable numbering widget,
      // { min: x, max: y, step: z} - enable widget and set ranges and step
      numbering: false
    };

    // Extend default settings with user defined ones
    var settings = $.extend({}, _defaults, options);

    // Chosen plugin instance reference
    var _chosen = null;

    // Badges dictionary
    var _badges = {};

    // Numbering mouse down timer
    var _numberingTimer = null;

    // On Chosen Ready event handler
    function _onChosenReady (evt, obj) {
      _chosen = obj.chosen;
      _renderBadges();
    }

    // Render badges
    function _renderBadges () {
      _chosen.results_data.forEach(function (result) {
        if (result.selected) {
          var key = result.value;
          _renderBadge(result.array_index, key);
        }
      });
    }

    // Badges setter (no render after set)
    function _set (key, value) {
      _badges[key] = value;
    }

    // Badges setter (rerender after set)
    function set (key, value) {
      _set(key, value);
      _renderBadges();
    }

    // Badges getter
    function get (key) {
      return key !== undefined ? _badges[key] : _filterBadges();
    }

    // Filter badges
    function _filterBadges() {
      var filtered = {};
      $.each(_badges, function (k, v) {
        if (v === null || v === undefined) {
          return;
        }
        filtered[k] = v;
      });
      return filtered;
    }

    // Delete badge
    function _delete (key) {
      _set(key, undefined);
    }

    // Call value callback/value
    function getValue (key) {
      var value = get(key);
      if (value === undefined) {
        value = $.isFunction(settings.value) ? settings.value(key, self) : settings.value;
        _set(key, value);
      }
      return value;
    }

    // Render badge
    function _renderBadge (idx, key) {
      _chosen.search_choices.find('li.search-choice')
      .each(function () {
        if (_indexEquals(this, idx)) {
          var badge = $(this).children('span');
          if (badge.hasClass('with-badge')) {
            badge
            .attr('data-badge-key', key)
            .attr('data-badge', getValue(key));
          } else {
            badge
            .addClass('with-badge')
            .attr('data-badge-key', key)
            .attr('data-badge', getValue(key))
            .on('click', _onBadgeClick)
            .on('mousedown', function (e) {
              e.stopPropagation(); // Do not show choices dropdown
            });
          }
          if (settings.numbering !== false &&
              badge.parent().find('.numbering-widget').length === 0) {
            badge.after(_renderNumbering(key));
            badge.parent().on('click mousedown', function (e) {
              e.stopPropagation(); // Do not show choices dropdown
            });
          }
        }
      });
    }

    // Render numbering widget
    function _renderNumbering(key) {
      if (settings.numbering === false) {
        return;
      }
      var upArrow =
        $(document.createElement('a'))
        .addClass('numbering-up-arrow')
        .on('click', function () {
          _numberingIncrease(key);
        })
        .on('mousedown', function () {
          clearInterval(_numberingTimer);
          _numberingTimer = setInterval(function () {
            _numberingIncrease(key);
          }, 200);
        })
        .on('mouseup mouseleave', function () {
          clearInterval(_numberingTimer);
        });
      var downArrow =
        $(document.createElement('a'))
        .addClass('numbering-down-arrow')
        .on('click', function () {
          _numberingDecrease(key);
        })
        .on('mousedown', function () {
          clearInterval(_numberingTimer);
          _numberingTimer = setInterval(function () {
            _numberingDecrease(key);
          }, 200);
        })
        .on('mouseup mouseleave', function () {
          clearInterval(_numberingTimer);
        });
      var widget =
        $(document.createElement('div'))
        .addClass('numbering-widget')
        .append(upArrow, downArrow)
        .on('mousedown', function (e) {
          e.stopPropagation();
        });
      return widget;
    }

    function _getNumberingMin (key) {
      if (settings.numbering === undefined || settings.numbering === false) {
        return;
      }
      var min = settings.numbering.min;
      return $.isFunction(min) ? min(key, self) : min;
    }

    function _getNumberingMax (key) {
      if (settings.numbering === undefined || settings.numbering === false) {
        return;
      }
      var max = settings.numbering.max;
      return $.isFunction(max) ? max(key, self) : max;
    }

    function _getNumberingStep (key) {
      if (settings.numbering === undefined || settings.numbering === false) {
        return;
      }
      var step = settings.numbering.step;
      step = $.isFunction(step) ? step(key, self) : step;
      return step || 1;
    }

    function _numberingIncrease (key) {
      var value = parseInt(get(key), 10);
      var step = _getNumberingStep(key);
      var max = _getNumberingMax(key);
      value += step;
      if (max !== undefined && value > max) {
        return;
      }
      set(key, value);
    }

    function _numberingDecrease (key) {
      var value = parseInt(get(key), 10);
      var step = _getNumberingStep(key);
      var min = _getNumberingMin(key);
      value -= step;
      if (min !== undefined && value < min) {
        return;
      }
      set(key, value);
    }

    // On Badge click handler
    function _onBadgeClick (evt) {
      var e = $.Event(pluginName + ':click');
      e.badge = self;
      e.key = $(evt.currentTarget).data('badge-key');
      e.value = $(evt.currentTarget).data('badge');
      $(element).triggerHandler(e, evt.currentTarget);
      return false;
    }

    // Check if choice index is equal to the provided one
    function _indexEquals (choice, idx) {
      var choice_idx = $(choice)
      .find('.search-choice-close')
      .attr('data-option-array-index');
      return parseInt(choice_idx, 10) === idx;
    }

    // On Change event handler
    function _onChange (e, o) {
      if (o.deselected !== undefined) {
        _delete(o.deselected);
      }
      _renderBadges();
    }

    // Initialize plugin
    function _init () {
      $(element)
      .on('chosen:ready', _onChosenReady)
      .on('change', _onChange);
    }

    _init();

    var self = {
      // Properties
      settings: settings,

      // Methods
      get: get,
      getValue: getValue,
      set: set,
    };

    return self;
  };

  $.fn[pluginName] = function (options) {
    this.each(function () {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
      }
    });
    return this;
  };

})(jQuery, window, document);
