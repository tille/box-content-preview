import LoadingIcon from './LoadingIcon';
import Notification from './Notification';
import shellTemplate from './shell.html';
import {
    CLASS_BOX_PREVIEW_BASE_HEADER,
    CLASS_BOX_PREVIEW_HAS_HEADER,
    CLASS_BOX_PREVIEW_HAS_NAVIGATION,
    CLASS_BOX_PREVIEW_HEADER,
    CLASS_BOX_PREVIEW_THEME_DARK,
    CLASS_HIDDEN,
    CLASS_PREVIEW_LOADED,
    SELECTOR_BOX_PREVIEW_BTN_DOWNLOAD,
    SELECTOR_BOX_PREVIEW_BTN_PRINT,
    SELECTOR_BOX_PREVIEW_CONTAINER,
    SELECTOR_BOX_PREVIEW_HEADER_CONTAINER,
    SELECTOR_BOX_PREVIEW_LOGO_CUSTOM,
    SELECTOR_BOX_PREVIEW_LOGO_DEFAULT,
    SELECTOR_BOX_PREVIEW,
    SELECTOR_BOX_PREVIEW_CONTENT,
    SELECTOR_BOX_PREVIEW_ICON,
    SELECTOR_NAVIGATION_LEFT,
    SELECTOR_NAVIGATION_RIGHT,
} from './constants';
import { insertTemplate } from './util';

class PreviewUI {
    /** @property {HTMLElement} - Container element */
    container;

    /** @property {HTMLElement} - Content container element */
    contentContainer;

    /** @property {Function} - Left navigation arrow handler */
    leftHandler;

    /** @property {Function} - Right navigation arrow handler */
    rightHandler;

    /** @property {Function} - Mousemove handler */
    mousemoveHandler;

    /** @property {Function} - Keydown handler */
    keydownHandler;

    /** @property {LoadingIcon} - Loading icon instance */
    loadingIcon;

    /** @property {HTMLElement} - Preview container element which houses the sidebar and content */
    previewContainer;

    /**
     * Destroy preview container content.
     *
     * @public
     * @return {void}
     */
    cleanup() {
        if (this.previewContainer) {
            this.previewContainer.removeEventListener('mousemove', this.mousemoveHandler);
        }

        if (this.loadingIcon) {
            this.loadingIcon.destroy();
            this.loadingIcon = null;
        }

        if (this.container) {
            this.container.innerHTML = '';
        }

        // Remove keyboard events
        document.removeEventListener('keydown', this.keydownHandler);
    }

    /**
     * Initializes the container for preview.
     *
     * @public
     * @param {Object} options - Setup options
     * @param {Function} keydown - Keydown handler
     * @param {Function} navigateLeft - Left navigation handler
     * @param {Function} navigateRight - Right navigation handler
     * @param {Function} mousemove - Mousemove handler
     * @return {HTMLElement} Preview container
     */
    setup(options, keydown, navigateLeft, navigateRight, mousemove) {
        this.container = options.container;
        this.leftHandler = navigateLeft;
        this.rightHandler = navigateRight;
        this.mousemoveHandler = mousemove;
        this.keydownHandler = keydown;

        if (typeof this.container === 'string') {
            // Get the container dom element if a selector was passed instead.
            this.container = document.querySelector(this.container);
        } else if (!this.container) {
            // Create the container if nothing was passed.
            this.container = document.body;
        }

        // Clear the content
        this.cleanup();

        // Create the preview with absolute positioning inside a relative positioned container
        // <bp-container>
        //      <bp-header>
        //      <bp>
        //      <navigation>
        // </bp-container>
        insertTemplate(this.container, shellTemplate);

        this.container = this.container.querySelector(SELECTOR_BOX_PREVIEW_CONTAINER);
        this.previewContainer = this.container.querySelector(SELECTOR_BOX_PREVIEW);
        this.contentContainer = this.container.querySelector(SELECTOR_BOX_PREVIEW_CONTENT);

        // Setup the header, buttons, and theme
        if (options.header !== 'none') {
            this.setupHeader(options.header, options.logoUrl);
        }

        // Destroy the loading icon if disabled
        if (options.showLoading === false) {
            this.destroyLoading();
        }

        // Attach keyboard events
        document.addEventListener('keydown', this.keydownHandler);

        return this.container;
    }

    /**
     * Whether the UI has been setup yet
     *
     * @public
     * @return {boolean} Whether the UI has been setup
     */
    isSetup() {
        return this.container && this.container.innerHTML !== '';
    }

    /**
     * Shows navigation arrows if there is a need
     *
     * @public
     * @param {number} id - File ID of current preview
     * @param {number[]} collection - Array of File IDs being previewed
     * @return {void}
     */
    showNavigation(id, collection) {
        // Before showing or updating navigation do some cleanup
        // that may be needed if the collection changes

        if (!this.container) {
            return;
        }

        const leftNavEl = this.container.querySelector(SELECTOR_NAVIGATION_LEFT);
        const rightNavEl = this.container.querySelector(SELECTOR_NAVIGATION_RIGHT);

        // If show navigation was called when shell is not ready then return
        if (!leftNavEl || !rightNavEl) {
            return;
        }

        // Set titles
        leftNavEl.title = __('previous_file');
        rightNavEl.title = __('next_file');

        // Hide the arrows by default
        leftNavEl.classList.add(CLASS_HIDDEN);
        rightNavEl.classList.add(CLASS_HIDDEN);
        this.previewContainer.classList.remove(CLASS_BOX_PREVIEW_HAS_NAVIGATION);

        leftNavEl.removeEventListener('click', this.leftHandler);
        rightNavEl.removeEventListener('click', this.rightHandler);
        this.previewContainer.removeEventListener('mousemove', this.mousemoveHandler);

        // Don't show navigation when there is no need
        if (collection.length < 2) {
            return;
        }

        this.previewContainer.classList.add(CLASS_BOX_PREVIEW_HAS_NAVIGATION);

        this.previewContainer.addEventListener('mousemove', this.mousemoveHandler);

        // Selectively show or hide the navigation arrows
        const index = collection.indexOf(id);

        if (index > 0) {
            leftNavEl.addEventListener('click', this.leftHandler);
            leftNavEl.classList.remove(CLASS_HIDDEN);
        }

        if (index < collection.length - 1) {
            rightNavEl.addEventListener('click', this.rightHandler);
            rightNavEl.classList.remove(CLASS_HIDDEN);
        }
    }

    /**
     * Shows the print button if the viewers implement print
     *
     * @public
     * @param {Function} handler - Print click handler
     * @return {void}
     */
    showPrintButton(handler) {
        const printButtonEl = this.container.querySelector(SELECTOR_BOX_PREVIEW_BTN_PRINT);
        if (!printButtonEl) {
            return;
        }

        printButtonEl.title = __('print');
        printButtonEl.classList.remove(CLASS_HIDDEN);
        printButtonEl.addEventListener('click', handler);
    }

    /**
     * Shows the download button if the viewers implement download
     *
     * @public
     * @param {Function} handler - Download click handler
     * @return {void}
     */
    showDownloadButton(handler) {
        const downloadButtonEl = this.container.querySelector(SELECTOR_BOX_PREVIEW_BTN_DOWNLOAD);
        if (!downloadButtonEl) {
            return;
        }

        downloadButtonEl.title = __('download');
        downloadButtonEl.classList.remove(CLASS_HIDDEN);
        downloadButtonEl.addEventListener('click', handler);
    }

    /**
     * Shows the loading indicator
     *
     * @public
     * @return {void}
     */
    showLoadingIndicator() {
        if (this.previewContainer) {
            this.previewContainer.classList.remove(CLASS_PREVIEW_LOADED);
        }
    }

    /**
     * Hides the loading indicator.
     *
     * @public
     * @return {void}
     */
    hideLoadingIndicator() {
        if (!this.previewContainer) {
            return;
        }

        this.previewContainer.classList.add(CLASS_PREVIEW_LOADED);
    }

    /**
     * Setup notification
     *
     * @public
     * @return {void}
     */
    setupNotification() {
        this.notification = new Notification(this.contentContainer);
    }

    /**
     * Shows a notification message.
     *
     * @public
     * @param {string} message - Notification message
     * @param {string} [buttonText] - Optional text to show in button
     * @param {boolean} [persist] - Optional boolean to persist the notification
     * @return {void}
     */
    showNotification(message, buttonText, persist) {
        if (!this.notification) {
            return;
        }

        this.notification.show(message, buttonText, persist);
    }

    /**
     * Hides the notification message. Does nothing if the notification is already hidden.
     *
     * @public
     * @return {void}
     */
    hideNotification() {
        if (!this.notification) {
            return;
        }

        this.notification.hide();
    }

    /**
     * Replaces the currently active header with a specified header
     *
     * @public
     * @param {string} replacementHeader - Class name of new header
     * @return {void}
     */
    replaceHeader(replacementHeader) {
        const headerToShow = this.container.querySelector(replacementHeader);
        if (!headerToShow) {
            return;
        }

        // First hide all possible headers
        const headers = this.container.querySelectorAll(`.${CLASS_BOX_PREVIEW_HEADER}`);
        [].forEach.call(headers, header => {
            header.classList.add(CLASS_HIDDEN);
        });

        // Show the specified header
        headerToShow.classList.remove(CLASS_HIDDEN);
    }

    /**
     * Sets the preview loading icon
     *
     * @public
     * @param {string} extension - File extension to use for loading icon
     * @return {void}
     */
    showLoadingIcon(extension) {
        const iconEl = this.container.querySelector(SELECTOR_BOX_PREVIEW_ICON);

        if (iconEl) {
            this.loadingIcon = this.loadingIcon || new LoadingIcon({ containerEl: iconEl });
            this.loadingIcon.render(extension);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------
    /**
     * Remove global loading indicator from the shell
     *
     * @private
     * @return {void}
     */
    destroyLoading() {
        const loadingIconEl = this.container.querySelector(SELECTOR_BOX_PREVIEW_ICON);
        if (!loadingIconEl) {
            return;
        }

        loadingIconEl.parentElement.removeChild(loadingIconEl);
    }

    /**
     * Sets up the preview header.
     *
     * @private
     * @param {string} headerTheme - Header theme - either 'light' or 'dark'
     * @param {string} logoUrl - URL of logo to use
     * @return {void}
     */
    setupHeader(headerTheme, logoUrl) {
        const headerContainerEl = this.container.querySelector(SELECTOR_BOX_PREVIEW_HEADER_CONTAINER);
        headerContainerEl.classList.remove(CLASS_HIDDEN);

        const headerEl = headerContainerEl.firstElementChild;
        headerEl.className = `${CLASS_BOX_PREVIEW_HEADER} ${CLASS_BOX_PREVIEW_BASE_HEADER}`;
        this.previewContainer.classList.add(CLASS_BOX_PREVIEW_HAS_HEADER);

        // Setup theme, default is 'light'
        if (headerTheme === 'dark') {
            this.container.classList.add(CLASS_BOX_PREVIEW_THEME_DARK);
        }

        // Set custom logo
        if (logoUrl) {
            const defaultLogoEl = headerEl.querySelector(SELECTOR_BOX_PREVIEW_LOGO_DEFAULT);
            defaultLogoEl.classList.add(CLASS_HIDDEN);

            const customLogoEl = headerEl.querySelector(SELECTOR_BOX_PREVIEW_LOGO_CUSTOM);
            customLogoEl.src = logoUrl;
            customLogoEl.classList.remove(CLASS_HIDDEN);
        }
    }
}

export default PreviewUI;
