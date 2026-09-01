(() => {
  const gluePattern = /(^|[\s([{„"«])((?:i|w|a|przy|ul\.))[\t\n\r ]+/giu;
  const ignoredSelector = "script, style, textarea, input, select, option, code, pre";

  const fixText = (text) => text.replace(gluePattern, "$1$2\u00a0");

  const shouldIgnore = (node) => {
    const parent = node.parentElement;
    return !parent || Boolean(parent.closest(ignoredSelector));
  };

  const fixTextNode = (node) => {
    if (shouldIgnore(node)) {
      return;
    }

    const fixed = fixText(node.nodeValue);
    if (fixed !== node.nodeValue) {
      node.nodeValue = fixed;
    }
  };

  const applyTypography = (root = document.body) => {
    if (!root) {
      return;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      fixTextNode(root);
      return;
    }

    if (
      root.nodeType !== Node.ELEMENT_NODE
      && root.nodeType !== Node.DOCUMENT_NODE
      && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
    ) {
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE && root.matches(ignoredSelector)) {
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node = walker.nextNode();

    while (node) {
      nodes.push(node);
      node = walker.nextNode();
    }

    nodes.forEach(fixTextNode);
  };

  applyTypography();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "characterData") {
        fixTextNode(mutation.target);
        return;
      }

      mutation.addedNodes.forEach(applyTypography);
    });
  });

  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  window.arianskaTypography = {
    refresh: applyTypography,
  };
})();
