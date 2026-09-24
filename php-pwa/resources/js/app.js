if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

// Prevent double-submits (e.g. a double-click on "Send activation code") from
// firing the request twice — disable the button right after the form submits.
document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const button = form.querySelector('button[type="submit"]');
    if (!button || button.disabled) return;

    requestAnimationFrame(() => {
        button.disabled = true;
        button.dataset.originalText ??= button.innerHTML;
        button.innerHTML = '<span class="inline-flex items-center gap-2">' +
            '<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>' +
            'Please wait…</span>';
    });
});

// Chip picker: a tap-to-select alternative to typing comma-separated lists.
// Markup contract:
//   <div class="chip-group" data-for="allergies"> <button type="button" class="chip" data-value="Peanuts">...</button> ... </div>
//   <input type="hidden" id="allergies" name="allergies" value="Peanuts, Dairy">
//   <div data-chip-add-for="allergies"> <input data-chip-add-input> <button type="button" data-chip-add-button>+ Add</button> </div>
function initChipPickers() {
    document.querySelectorAll('.chip-group[data-for]').forEach((group) => {
        const field = group.dataset.for;
        const hidden = document.getElementById(field);
        if (!hidden) return;

        const selected = new Set(
            (hidden.value || '')
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean)
        );

        const sync = () => {
            hidden.value = Array.from(selected).join(', ');
        };

        const applyState = (chip) => {
            const isSelected = selected.has(chip.dataset.value);
            chip.classList.toggle('chip-selected', isSelected);
            chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        };

        // Add chips for any preset options not already rendered, and mark existing ones.
        group.querySelectorAll('.chip').forEach((chip) => applyState(chip));

        // Render chips for custom values already in the field that have no preset button.
        selected.forEach((value) => {
            if (![...group.querySelectorAll('.chip')].some((c) => c.dataset.value === value)) {
                group.appendChild(makeChip(value, true));
            }
        });

        group.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip || !group.contains(chip)) return;

            const value = chip.dataset.value;
            if (selected.has(value)) {
                selected.delete(value);
            } else {
                selected.add(value);
            }
            applyState(chip);
            sync();
        });

        function makeChip(value, isSelected) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip';
            chip.dataset.value = value;
            chip.dataset.custom = 'true';
            chip.textContent = value;
            chip.classList.toggle('chip-selected', isSelected);
            chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            return chip;
        }

        const adder = document.querySelector(`[data-chip-add-for="${field}"]`);
        if (adder) {
            const input = adder.querySelector('[data-chip-add-input]');
            const button = adder.querySelector('[data-chip-add-button]');
            const addValue = () => {
                const value = (input.value || '').trim();
                if (!value || selected.has(value)) return;
                selected.add(value);
                group.appendChild(makeChip(value, true));
                sync();
                input.value = '';
                input.focus();
            };
            button?.addEventListener('click', addValue);
            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addValue();
                }
            });
        }

        sync();
    });
}

document.addEventListener('DOMContentLoaded', initChipPickers);
