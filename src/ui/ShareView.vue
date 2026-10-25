<script setup lang="ts">
import { ref } from 'vue';
import { decodeProgress, encodeProgress, type DecodeResult, type Progress } from '../domain/progressCode';
import { useGameStore } from './gameStore';

type DecodeError = Extract<DecodeResult, { ok: false }>['error'];

const RESTORE_ERRORS: Record<DecodeError, string> = {
  'not-a-code': 'This does not look like a progress code. Codes start with GT1-.',
  typo: 'This code has a typo or is incomplete. Copy it again from the message.',
  'newer-version': 'This code comes from a newer version of the game. Ask your teacher for the latest link.',
  corrupt: 'This code is damaged. Ask for it to be sent again.',
};

const store = useGameStore();

const nickname = ref(store.game.nickname ?? '');
const nicknameMissing = ref(false);
const code = ref('');
const copied = ref(false);
const codeField = ref<HTMLTextAreaElement>();

const restoreText = ref('');
const restoreError = ref('');
const pending = ref<Progress>();
const restoredMessage = ref('');

const createCode = async () => {
  const trimmed = nickname.value.trim();
  nicknameMissing.value = trimmed === '';
  if (nicknameMissing.value) return;
  store.setNickname(trimmed);
  code.value = await encodeProgress(store.game, trimmed, store.now());
  copied.value = false;
};

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
  } catch {
    codeField.value?.select();
  }
};

const checkRestore = async () => {
  restoredMessage.value = '';
  const result = await decodeProgress(restoreText.value);
  if (result.ok) {
    restoreError.value = '';
    pending.value = result.progress;
  } else {
    restoreError.value = RESTORE_ERRORS[result.error];
    pending.value = undefined;
  }
};

const confirmRestore = () => {
  if (!pending.value) return;
  store.restore(pending.value);
  nickname.value = pending.value.nickname;
  restoredMessage.value = `Progress restored for ${pending.value.nickname}: ${store.caughtCount} Pokémon caught.`;
  pending.value = undefined;
  restoreText.value = '';
};
</script>

<template>
  <section class="panel stack" aria-labelledby="share-title">
    <h2 id="share-title" class="pixel">Share my progress</h2>
    <p class="hint">Your teacher sees how well you know each grammar rule and how many Pokémon you caught.</p>

    <label for="share-nickname">Nickname</label>
    <input id="share-nickname" v-model="nickname" type="text" maxlength="30" autocomplete="nickname" />
    <p v-if="nicknameMissing" class="error" role="alert">Type a nickname so your teacher knows the code is yours.</p>
    <button id="create-code" type="button" class="primary" @click="createCode">Create my code</button>

    <template v-if="code">
      <label for="share-code">Your code</label>
      <textarea id="share-code" ref="codeField" :value="code" rows="4" readonly @focus="codeField?.select()"></textarea>
      <button id="copy-code" type="button" class="secondary" @click="copyCode">{{ copied ? 'Copied!' : 'Copy my code' }}</button>
      <p class="hint">Paste it in a message to your teacher. Keep it too: it brings your game back if this browser loses it.</p>
    </template>
  </section>

  <section class="panel stack" aria-labelledby="restore-title">
    <h2 id="restore-title" class="pixel">Restore my progress</h2>
    <label for="restore-code">Paste a code</label>
    <textarea id="restore-code" v-model="restoreText" rows="3"></textarea>
    <button id="check-restore" type="button" class="secondary" @click="checkRestore">Restore</button>
    <p v-if="restoreError" class="error" role="alert">{{ restoreError }}</p>

    <div v-if="pending" class="confirm">
      <p>
        This replaces your current progress ({{ store.caughtCount }} Pokémon caught) with the progress of {{ pending.nickname }} ({{
          Object.keys(pending.caught).length
        }}
        Pokémon caught).
      </p>
      <div class="actions">
        <button id="confirm-restore" type="button" class="primary" @click="confirmRestore">Replace my progress</button>
        <button id="cancel-restore" type="button" class="secondary" @click="pending = undefined">Cancel</button>
      </div>
    </div>
    <p v-if="restoredMessage" class="success" role="status">{{ restoredMessage }}</p>
  </section>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h2 {
  margin: 0;
}

label {
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
}

textarea {
  font-family: ui-monospace, monospace;
  font-size: 14px;
  word-break: break-all;
  resize: vertical;
}

input:focus-visible,
textarea:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 1px;
}

.hint {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.error {
  margin: 0;
  color: var(--bad);
  font-weight: 600;
}

.success {
  margin: 0;
  color: var(--good);
  font-weight: 600;
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 2px solid var(--bad);
  border-radius: 8px;
}

.confirm p {
  margin: 0;
}

.actions {
  display: grid;
  gap: 8px;
}
</style>
