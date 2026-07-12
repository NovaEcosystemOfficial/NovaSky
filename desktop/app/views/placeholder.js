/** Placeholder viste in sviluppo. */

export function mountPlaceholder(container, ctx, title, description) {
  container.innerHTML = `
    <section class="view-placeholder">
      <h2>${title}</h2>
      <p>${description}</p>
    </section>
  `;

  if (ctx.panelBody) {
    ctx.panelBody.innerHTML = `<p>In arrivo nelle prossime versioni di NovaSky Desktop.</p>`;
  }
}
