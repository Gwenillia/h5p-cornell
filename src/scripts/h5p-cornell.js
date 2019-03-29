// Import required classes
import CornellContent from './h5p-cornell-content';
import Util from './h5p-cornell-util';

/**
 * Class representing Cornell Notes.
 *
 * - Extends H5P.Question which offers functions for setting the DOM
 * - Implements the question type contract necessary for reporting and for
 *   making the content type usable in compound content types like Question Set
 *   Cpm. https://h5p.org/documentation/developers/contracts
 * - Implements getCurrentState to allow continuing a user's previous session
 * - Uses a separate content class to organitze files
 */
export default class Cornell extends H5P.Question {
  /**
   * @constructor
   *
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('cornell'); // CSS class selector for content's iframe: h5p-cornell

    this.contentId = contentId;
    this.extras = extras;

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */

    // Make sure all variables are set
    this.params = Util.extend({
      instructions: 'Do this and that ...',
      recallTitle: 'Recall',
      recallPlaceholder: 'Enter your keywords, questions, the main idea, etc.',
      notesTitle: 'Notes',
      notesPlaceholder: 'Enter dates, details, definitions, formulas, examples, etc.',
      summaryTitle: 'Summary',
      summarPlaceholder: 'Enter your summary',
      fieldSizeNotes: 10,
      fieldSizeSummary: 5,
      behaviour: {
        enableSolutionsButton: false,
        enableRetry: false
      },
      l10n: {
        submitAnswer: 'Submit',
        fullscreen: 'Fullscreen'
      }
    }, params);

    // previousState now holds the saved content state of the previous session
    this.extras = Util.extend({
      metadata: {
        title: 'Cornell Notes',
      },
      previousState: {}
    }, extras);

    // Add fullscreen button on first call after H5P.Question has created the DOM
    this.on('domChanged', () => {
      if (this.isFullScreenButtonInitialized) {
        return;
      }

      const container = document.querySelector('.h5p-container');
      if (container) {
        this.isFullScreenButtonInitialized = true;
        this.addFullScreenButton(container);
      }
    });

    /**
     * Register the DOM elements with H5P.Question
     */
    this.registerDomElements = () => {
      this.content = new CornellContent(this.params, this.contentId, this.extras, {
        resize: this.resize
      });

      // Register content with H5P.Question
      this.setContent(this.content.getDOM());

      // Register Buttons
      // this.addButtons();

      /*
       * H5P.Question also offers some more functions that could be used.
       * Consult https://github.com/h5p/h5p-question for details
       */
    };

    /**
     * Add fullscreen button.
     *
     * @param {HTMLElement} wrapper HTMLElement to attach button to.
     */
    this.addFullScreenButton = wrapper => {
      if (H5P.canHasFullScreen !== true) {
        return;
      }

      const toggleFullScreen = () => {
        if (H5P.isFullscreen === true) {
          H5P.exitFullScreen();
        }
        else {
          H5P.fullScreen(H5P.jQuery(wrapper), this);
        }
      };

      this.fullScreenButton = document.createElement('button');
      this.fullScreenButton.classList.add('h5p-cornell-fullscreen-button');
      this.fullScreenButton.classList.add('h5p-cornell-enter-fullscreen');
      this.fullScreenButton.setAttribute('title', this.params.l10n.fullscreen);
      this.fullScreenButton.setAttribute('aria-label', this.params.l10n.fullscreen);
      this.fullScreenButton.addEventListener('click', toggleFullScreen);
      this.fullScreenButton.addEventListener('keyPress', (event) => {
        if (event.which === 13 || event.which === 32) {
          toggleFullScreen();
          event.preventDefault();
        }
      });

      this.on('enterFullScreen', () => {
        this.content.setFullScreen(true);
      });

      this.on('exitFullScreen', () => {
        this.content.setFullScreen(false);
      });

      const fullScreenButtonWrapper = document.createElement('div');
      fullScreenButtonWrapper.classList.add('h5p-cornell-fullscreen-button-wrapper');
      fullScreenButtonWrapper.appendChild(this.fullScreenButton);

      wrapper.insertBefore(fullScreenButtonWrapper, wrapper.firstChild);
    };

    /**
     * Add all the buttons that shall be passed to H5P.Question.
     */
    this.addButtons = () => {
      // Check answer button
      this.addButton('check-answer', this.params.l10n.submitAnswer, () => {
        // TODO: Implement something useful to do on click
      }, true, {}, {});
    };

    /**
     * Check if result has been submitted or input has been given.
     *
     * @return {boolean} True, if answer was given.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswerGiven = () => false; // TODO: Return your value here

    /**
     * Get latest score.
     *
     * @return {number} latest score.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => 0; // TODO: Return real score here

    /**
     * Get maximum possible score.
     *
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => 0; // TODO: Return real maximum score here

    /**
     * Show solutions.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
      // TODO: Implement showing the solutions

      this.resize();
    };

    /**
     * Reset task.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
     */
    this.resetTask = () => {
      // TODO: Reset what needs to be reset
    };

    /**
     * Resize Listener.
     */
    this.on('resize', (event) => {
      // Initial resizing of content after DOM is ready.
      if (event.data && event.data.break === true) {
        return;
      }

      this.content.resize();
    });

    /**
     * Resize.
     */
    this.resize = () => {
      this.trigger('resize', {break: true});
    };

    /**
     * Get xAPI data.
     *
     * @return {object} XAPI statement.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     */
    this.getXAPIData = () => ({
      statement: this.getXAPIAnswerEvent().data.statement
    });

    /**
     * Build xAPI answer event.
     *
     * @return {H5P.XAPIEvent} XAPI answer event.
     */
    this.getXAPIAnswerEvent = () => {
      const xAPIEvent = this.createXAPIEvent('answered');

      xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this,
        true, this.isPassed());

      /*
       * TODO: Add other properties here as required, e.g. xAPIEvent.data.statement.result.response
       * https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#245-result
       */

      return xAPIEvent;
    };

    /**
     * Create an xAPI event for Dictation.
     *
     * @param {string} verb Short id of the verb we want to trigger.
     * @return {H5P.XAPIEvent} Event template.
     */
    this.createXAPIEvent = (verb) => {
      const xAPIEvent = this.createXAPIEventTemplate(verb);
      // TODO: Check this when adding xAPI support
      Util.extend(
        xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
        this.getxAPIDefinition());
      return xAPIEvent;
    };

    /**
     * Get the xAPI definition for the xAPI object.
     *
     * @return {object} XAPI definition.
     */
    this.getxAPIDefinition = () => {
      const definition = {};
      definition.name = {'en-US': this.getTitle()};
      definition.description = {'en-US': this.getDescription()};

      // TODO: Set IRI as required for your verb, cmp. http://xapi.vocab.pub/verbs/#
      definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';

      // TODO: Set as required, cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#interaction-types
      definition.interactionType = 'other';

      /*
       * TODO: Add other object properties as required, e.g. definition.correctResponsesPattern
       * cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#244-object
       */

      return definition;
    };

    /**
     * Determine whether the task has been passed by the user.
     *
     * @return {boolean} True if user passed or task is not scored.
     */
    this.isPassed = () => true;

    /**
     * Get tasks title.
     *
     * @return {string} Title.
     */
    this.getTitle = () => {
      let raw;
      if (this.extras.metadata) {
        raw = this.extras.metadata.title;
      }
      raw = raw || Cornell.DEFAULT_DESCRIPTION;

      // H5P Core function: createTitle
      return H5P.createTitle(raw);
    };

    /**
     * Get tasks description.
     *
     * @return {string} Description.
     */
    // TODO: Have a field for a task description in the editor if you need one.
    this.getDescription = () => this.params.taskDescription || Cornell.DEFAULT_DESCRIPTION;

    /**
     * Answer call to return the current state.
     *
     * @return {object} Current state.
     */
    this.getCurrentState = () => this.content.getCurrentState();
  }
}

/** @constant {string} */
Cornell.DEFAULT_DESCRIPTION = 'Cornell Notes';
