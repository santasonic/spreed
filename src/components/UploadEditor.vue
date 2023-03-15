<!--
  - @copyright Copyright (c) 2020 Marco Ambrosini <marcoambrosini@icloud.com>
  -
  - @author Marco Ambrosini <marcoambrosini@icloud.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
-->

<template>
	<NcModal v-if="showModal"
		ref="modal"
		:size="isVoiceMessage ? 'small' : 'normal'"
		class="upload-editor"
		:container="container"
		@close="handleDismiss">
		<div class="upload-editor">
			<template v-if="!isVoiceMessage">
				<!--native file picker, hidden -->
				<input id="file-upload"
					ref="fileUploadInput"
					multiple
					type="file"
					class="hidden-visually"
					@change="handleFileInput">
				<transition-group class="upload-editor__previews"
					name="fade"
					tag="div">
					<template v-for="file in files">
						<FilePreview :key="file.temporaryMessage.id"
							v-bind="file.temporaryMessage.messageParameters.file"
							:is-upload-editor="true"
							@remove-file="handleRemoveFileFromSelection" />
					</template>
					<div :key="'addMore'"
						class="add-more">
						<NcButton :aria-label="addMoreAriaLabel"
							type="primary"
							class="add-more__button"
							@click="clickImportInput">
							<template #icon>
								<Plus :size="48" />
							</template>
						</NcButton>
					</div>
				</transition-group>
			</template>
			<template v-else>
				<AudioPlayer :name="voiceMessageName"
					:local-url="voiceMessageLocalURL" />
			</template>
			<NewMessageForm v-if="modalContainerId"
				class="upload-editor__message-form"
				role="region"
				:token="token"
				:breakout-room="true"
				:container-id="modalContainerId"
				:aria-label="t('spreed', 'Post message')"
				:upload="true"
				@sent="handleUpload"
				@failure="handleDismiss" />
		</div>
	</NcModal>
</template>

<script>

import Plus from 'vue-material-design-icons/Plus.vue'

import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcModal from '@nextcloud/vue/dist/Components/NcModal.js'

import AudioPlayer from './MessagesList/MessagesGroup/Message/MessagePart/AudioPlayer.vue'
import FilePreview from './MessagesList/MessagesGroup/Message/MessagePart/FilePreview.vue'
import NewMessageForm from './NewMessageForm/NewMessageForm.vue'

export default {
	name: 'UploadEditor',

	components: {
		AudioPlayer,
		FilePreview,
		NcButton,
		NcModal,
		NewMessageForm,
		Plus,
	},

	data() {
		return {
			mediaCaption: '',
			modalContainerId: null,
		}
	},

	computed: {
		token() {
			return this.$store.getters.getToken()
		},

		currentUploadId() {
			return this.$store.getters.currentUploadId
		},

		files() {
			if (this.currentUploadId) {
				return this.$store.getters.getInitialisedUploads(this.currentUploadId)
			}
			return []
		},

		showModal() {
			return !!this.currentUploadId
		},

		container() {
			return this.$store.getters.getMainContainerSelector()
		},

		addMoreAriaLabel() {
			return t('spreed', 'Add more files')
		},

		firstFile() {
			return this.files[Object.keys(this.files)[0]]
		},

		// Hide the plus button in case this editor is used while sending a voice message
		isVoiceMessage() {
			if (!this.firstFile) {
				return false
			}
			return this.firstFile.temporaryMessage.messageType === 'voice-message'
		},

		voiceMessageName() {
			if (!this.firstFile.file.name) {
				return ''
			}
			return this.firstFile.file.name
		},

		voiceMessageLocalURL() {
			if (!this.firstFile.file.localURL) {
				return ''
			}
			return this.firstFile.file.localURL
		},
	},

	watch: {
		showModal(show) {
			if (show) {
				this.getContainerId()
			}
		},
	},

	methods: {
		getContainerId() {
			this.$nextTick(() => {
				// Postpone render of NewMessageForm until modal container is mounted
				this.modalContainerId = `#modal-description-${this.$refs.modal.randId}`
			})
		},

		handleDismiss() {
			this.$store.dispatch('discardUpload', this.currentUploadId)
		},

		handleUpload(mediaCaption) {
			this.$store.dispatch('uploadFiles', { uploadId: this.currentUploadId, mediaCaption })
		},
		/**
		 * Clicks the hidden file input when clicking the correspondent NcActionButton,
		 * thus opening the file-picker
		 */
		clickImportInput() {
			this.$refs.fileUploadInput.click()
		},

		async handleFileInput(event) {
			const files = Object.values(event.target.files)
			await this.$store.dispatch('initialiseUpload', { files, token: this.token, uploadId: this.currentUploadId })
		},

		handleRemoveFileFromSelection(id) {
			this.$store.dispatch('removeFileFromSelection', id)
		},
	},
}
</script>

<style lang="scss" scoped>
@import '../assets/variables';

.upload-editor {
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 16px;

	&__previews {
		display: flex;
		position: relative;
		overflow: auto;
		flex-wrap: wrap;
	}
	&__message-form {
		margin-top: 16px;
		margin-bottom: 4px;
		width: 100%;
	}
}

.add-more {
	width: 180px;
	height: 180px;
	display: flex;
	margin: 10px;
	&__button {
		margin: auto;
	}
}

:deep(.modal-container) {
	// Fix visibility for popovers, like EmojiPicker
	overflow: visible !important;
}

</style>
