document.addEventListener('DOMContentLoaded', function () {
  const sections = document.querySelectorAll('.featured-collections-tabs');

  sections.forEach(section => {
    const buttons = section.querySelectorAll('.tab-button');

    buttons.forEach(button => {
      button.addEventListener('click', function () {
        const tabId = this.getAttribute('data-tab');

        // Reset all tabs and panels in this section
        section.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        section.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // Activate current
        this.classList.add('active');
        const activePanel = section.querySelector(`#tab-content-${tabId}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });
  });
});