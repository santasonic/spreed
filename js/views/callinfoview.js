/* global Marionette */

/**
 *
 * @copyright Copyright (c) 2017, Daniel Calviño Sánchez (danxuliu@gmail.com)
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

(function(OC, OCA, Marionette, $, _) {

	'use strict';

	OCA.SpreedMe = OCA.SpreedMe || {};
	OCA.Talk = OCA.Talk || {};
	OCA.SpreedMe.Views = OCA.SpreedMe.Views || {};
	OCA.Talk.Views = OCA.Talk.Views || {};

	var CallInfoView  = Marionette.View.extend({

		tagName: 'div',

		template: function(context) {
			// OCA.Talk.Views.Templates may not have been initialized when this
			// view is initialized, so the template can not be directly
			// assigned.
			return OCA.Talk.Views.Templates['callinfoview'](context);
		},

		renderTimeout: undefined,

		templateContext: function() {
			var canModerate = this._canModerate();
			var canFullModerate = this._canFullModerate();
			var isPublic = this.model.get('type') === OCA.SpreedMe.app.ROOM_TYPE_PUBLIC;
			return $.extend(this.model.toJSON(), {
				isRoomForFile: this.model.get('objectType') === 'file',
				fileLink: OC.generateUrl('/f/{fileId}', { fileId: this.model.get('objectId') }),
				fileLinkTitle: t('spreed', 'Go to file'),
				showRoomModerationMenu: canModerate && (canFullModerate || isPublic),
				canFullModerate: canFullModerate,
				linkLabel: t('spreed', 'Guests'),
				linkCheckboxLabel: t('spreed', 'Share link'),
				copyLinkLabel: t('spreed', 'Copy link'),
				enableForLabel: t('spreed', 'Enable for'),
				allParticipantsLabel: t('spreed', 'All participants'),
				moderatorsOnlyLabel: t('spreed', 'Moderators only'),
				allParticipantsValue: OCA.SpreedMe.app.LOBBY_NONE,
				moderatorsOnlyValue: OCA.SpreedMe.app.LOBBY_NON_MODERATORS,
				lobbyStateAllParticipants: this.model.get('lobbyState') === OCA.SpreedMe.app.LOBBY_NONE,
				lobbyStateModeratorsOnly: this.model.get('lobbyState') === OCA.SpreedMe.app.LOBBY_NON_MODERATORS,
				lobbyTimerPlaceholder: t('spreed', 'Start time (optional)'),
				// PHP timestamp is second-based; JavaScript timestamp is
				// millisecond based.
				lobbyTimerValue: this.model.get('lobbyTimer')? OC.Util.formatDate(this.model.get('lobbyTimer') * 1000, 'YYYY-MM-DD HH:mm:ss') : '',
				isPublic: isPublic,
				passwordInputPlaceholder: this.model.get('hasPassword')? t('spreed', 'Change password'): t('spreed', 'Set password'),
				isDeletable: canModerate && (Object.keys(this.model.get('participants')).length > 2 || this.model.get('numGuests') > 0)
			});
		},

		ui: {
			'roomName': 'div.room-name',
			'fileLink': '.file-link',
			'clipboardButton': '.clipboard-button',
			'linkCheckbox': '.link-checkbox',
			'linkCheckboxLabel': '.link-checkbox-label',

			'callButton': 'div.call-button',

			'passwordForm': '.password-form',
			'passwordInput': '.password-input',
			'passwordConfirm': '.password-confirm',
			'passwordLoading': '.password-loading',

			'roomModerationButton': '.room-moderation-button .button',
			'roomModerationMenu': '.room-moderation-button .menu',

			'allParticipantsRadio': '.all-participants-radio',
			'moderatorsOnlyRadio': '.moderators-only-radio',
			'allParticipantsLabel': '.all-participants-label',
			'moderatorsOnlyLabel': '.moderators-only-label',

			'lobbyTimerForm': '.lobby-timer-form',
			'lobbyTimerInput': '.lobby-timer-input',
			'lobbyTimerConfirm': '.lobby-timer-confirm',
			'lobbyTimerLoading': '.lobby-timer-loading',
		},

		regions: {
			'roomName': '@ui.roomName',
			'callButton': '@ui.callButton',
		},

		events: {
			'change @ui.linkCheckbox': 'toggleLinkCheckbox',

			'click @ui.passwordConfirm': 'confirmPassword',
			'submit @ui.passwordForm': 'confirmPassword',

			'click @ui.allParticipantsRadio': 'setLobbyStateAllParticipants',
			'click @ui.moderatorsOnlyRadio': 'setLobbyStateModeratorsOnly',

			'click @ui.lobbyTimerConfirm': 'confirmLobbyTimer',
			'submit @ui.lobbyTimerForm': 'confirmLobbyTimer',
		},

		modelEvents: {
			'change:hasPassword': function() {
				this.render();
			},
			'change:lobbyState': function() {
				this.render();
			},
			'change:lobbyTimer': function() {
				this.render();
			},
			'change:participantType': function() {
				this._updateNameEditability();

				// User permission change, refresh even when typing, because the
				// action will fail in the future anyway.
				this.render();
			},
			'change:type': function() {
				this._updateNameEditability();

				this.render();
			}
		},

		initialize: function() {
			var nameAttribute = 'name';
			if (this.model.get('objectType') === 'share:password' ||
				this.model.get('type') === OCA.SpreedMe.app.ROOM_TYPE_CHANGELOG) {
				nameAttribute = 'displayName';
			}

			this._nameEditableTextLabel = new OCA.SpreedMe.Views.EditableTextLabel({
				model: this.model,
				modelAttribute: nameAttribute,
				modelSaveOptions: {
					wait: true,
					error: function() {
						OC.Notification.show(t('spreed', 'Error occurred while renaming the room'), {type: 'error'});
					}
				},

				extraClassNames: 'room-name',
				labelTagName: 'h2',
				inputMaxLength: '200',
				inputPlaceholder: t('spreed', 'Name'),
				labelPlaceholder: t('spreed', 'Conversation name'),
				buttonTitle: t('spreed', 'Rename')
			});

			this._callButton = new OCA.SpreedMe.Views.CallButton({
				model: this.model,
				connection: OCA.SpreedMe.app.connection,
			});

			this._updateNameEditability();
		},

		onBeforeRender: function() {
			// During the rendering the regions of this view are reset, which
			// destroys its child views. If a child view has to be detached
			// instead so it can be attached back after the rendering of the
			// template finishes it is necessary to call "reset" with the
			// "preventDestroy" option (in later Marionette versions a public
			// "detachView" function was introduced instead).
			// "allowMissingEl" is needed for the first time this view is
			// rendered, as the element of the region does not exist yet at that
			// time and without that option the call would fail otherwise.
			this.getRegion('roomName').reset({ preventDestroy: true, allowMissingEl: true });
			this.getRegion('callButton').reset({ preventDestroy: true, allowMissingEl: true });
		},

		onRender: function() {
			if (!_.isUndefined(this.renderTimeout)) {
				clearTimeout(this.renderTimeout);
				this.renderTimeout = undefined;
			}

			// Attach the child views again (or for the first time) after the
			// template has been rendered.
			this.showChildView('roomName', this._nameEditableTextLabel, { replaceElement: true } );
			this.showChildView('callButton', this._callButton, { replaceElement: true } );

			var roomURL = OC.generateUrl('/call/' + this.model.get('token')),
				completeURL = window.location.protocol + '//' + window.location.host + roomURL;

			this.ui.lobbyTimerInput.tooltip({
				placement: 'bottom',
				trigger: 'hover',
				title: 'YYYY-MM-DD HH:mm'
			});

			this.ui.clipboardButton.attr('value', completeURL);
			this.ui.clipboardButton.attr('data-clipboard-text', completeURL);
			this.ui.clipboardButton.tooltip({
				placement: 'bottom',
				trigger: 'manual',
				title: t('core', 'Link copied!')
			});
			this.initClipboard();

			// Set the body as the container to show the tooltip in front of the
			// header.
			this.ui.fileLink.tooltip({container: $('body')});

			OC.registerMenu(this.ui.roomModerationButton, this.ui.roomModerationMenu);
		},

		_canModerate: function() {
			return this.model.get('type') !== 1 && (this._canFullModerate() || this.model.get('participantType') === 6);
		},

		_canFullModerate: function() {
			return this.model.get('participantType') === 1 || this.model.get('participantType') === 2;
		},

		_updateNameEditability: function() {
			if (this.model.get('objectType') === 'share:password') {
				this._nameEditableTextLabel.disableEdition();
				return;
			}

			if (this._canModerate() && this.model.get('type') !== 1) {
				this._nameEditableTextLabel.enableEdition();
			} else {
				this._nameEditableTextLabel.disableEdition();
			}

			// This if-case should be removed when we fix room model for
			// oneToOne calls. OneToOne calls should not have userId set as room
			// name by default. We use it now for avatars, but a new attribute
			// should be added to the room model for displaying room images.
			// This has to be added below the "enable/disableEdition" calls as
			// those calls render the view if needed, while the setters expect
			// the view to be already rendered.
			if (this.model.get('type') === OCA.SpreedMe.app.ROOM_TYPE_ONE_TO_ONE) {
				this._nameEditableTextLabel.setModelAttribute(undefined);
				this._nameEditableTextLabel.setLabelPlaceholder(t('spreed', 'Conversation with {name}', {name: this.model.get('displayName')}));
			} else if (this.model.get('type') === OCA.SpreedMe.app.ROOM_TYPE_CHANGELOG) {
				this._nameEditableTextLabel.setModelAttribute(undefined);
				this._nameEditableTextLabel.setLabelPlaceholder(this.model.get('displayName'));
			} else {
				this._nameEditableTextLabel.setModelAttribute('name');
				this._nameEditableTextLabel.setLabelPlaceholder(t('spreed', 'Conversation name'));
			}
		},

		/**
		 * Share link
		 */
		toggleLinkCheckbox: function() {
			var isPublic = this.ui.linkCheckbox.prop('checked');

			this.ui.linkCheckbox.prop('disabled', true);
			this.ui.linkCheckboxLabel.addClass('icon-loading-small');

			this.model.setPublic(isPublic, {
				wait: true,
				error: function() {
					this.ui.linkCheckbox.prop('checked', !isPublic);
					this.ui.linkCheckbox.prop('disabled', false);
					this.ui.linkCheckboxLabel.removeClass('icon-loading-small');

					if (isPublic) {
						OC.Notification.show(t('spreed', 'Error occurred while making the room public'), {type: 'error'});
					} else {
						OC.Notification.show(t('spreed', 'Error occurred while making the room private'), {type: 'error'});
					}
				}.bind(this)
			});
		},

		/**
		 * Password
		 */
		confirmPassword: function(e) {
			e.preventDefault();

			var newPassword = this.ui.passwordInput.val().trim();

			this.ui.passwordInput.prop('disabled', true);
			this.ui.passwordConfirm.addClass('hidden');
			this.ui.passwordLoading.removeClass('hidden');

			var restoreState = function() {
				this.ui.passwordInput.prop('disabled', false);
				this.ui.passwordConfirm.removeClass('hidden');
				this.ui.passwordLoading.addClass('hidden');
			}.bind(this);

			this.model.setPassword(newPassword, {
				wait: true,
				success: function() {
					this.ui.passwordInput.val('');
					restoreState();
					OC.hideMenus();
					this.ui.roomModerationButton.focus();
				}.bind(this),
				error: function() {
					restoreState();

					OC.Notification.show(t('spreed', 'Error occurred while setting password'), {type: 'error'});
				}.bind(this)
			});
		},

		setLobbyStateAllParticipants: function() {
			if (this.model.get('lobbyState') === OCA.SpreedMe.app.LOBBY_NONE) {
				return;
			}

			this.ui.allParticipantsRadio.prop('disabled', true);
			this.ui.allParticipantsLabel.addClass('icon-loading-small');

			this.model.setLobbyState(OCA.SpreedMe.app.LOBBY_NONE, {
				wait: true,
				error: function() {
					if (this.model.get('lobbyState') === OCA.SpreedMe.app.LOBBY_NONE) {
						this.ui.allParticipantsRadio.prop('checked', true);
					} else {
						this.ui.moderatorsOnlyRadio.prop('checked', true);
					}
					this.ui.allParticipantsRadio.prop('disabled', false);
					this.ui.allParticipantsLabel.removeClass('icon-loading-small');

					OC.Notification.show(t('spreed', 'Error occurred while enabling for all participants'), {type: 'error'});
				}.bind(this)
			});
		},

		setLobbyStateModeratorsOnly: function() {
			if (this.model.get('lobbyState') === OCA.SpreedMe.app.LOBBY_NON_MODERATORS) {
				return;
			}

			this.ui.moderatorsOnlyRadio.prop('disabled', true);
			this.ui.moderatorsOnlyLabel.addClass('icon-loading-small');

			this.model.setLobbyState(OCA.SpreedMe.app.LOBBY_NON_MODERATORS, {
				wait: true,
				error: function() {
					if (this.model.get('lobbyState') === OCA.SpreedMe.app.LOBBY_NONE) {
						this.ui.allParticipantsRadio.prop('checked', true);
					} else {
						this.ui.moderatorsOnlyRadio.prop('checked', true);
					}
					this.ui.moderatorsOnlyRadio.prop('disabled', false);
					this.ui.moderatorsOnlyLabel.removeClass('icon-loading-small');

					OC.Notification.show(t('spreed', 'Error occurred while enabling only for moderators'), {type: 'error'});
				}.bind(this)
			});
		},

		confirmLobbyTimer: function(e) {
			e.preventDefault();

			var lobbyTimerTimestamp = 0;

			var lobbyTimerInputValue = this.ui.lobbyTimerInput.val().trim();
			if (lobbyTimerInputValue) {
				// PHP timestamp is second-based; JavaScript timestamp is
				// millisecond based.
				lobbyTimerTimestamp = Date.parse(lobbyTimerInputValue) / 1000;
			}

			if (isNaN(lobbyTimerTimestamp)) {
				OC.Notification.show(t('spreed', 'Invalid start time format'), {type: 'error'});

				return;
			}

			this.ui.lobbyTimerInput.prop('disabled', true);
			this.ui.lobbyTimerConfirm.addClass('hidden');
			this.ui.lobbyTimerLoading.removeClass('hidden');

			var restoreState = function() {
				this.ui.lobbyTimerInput.prop('disabled', false);
				this.ui.lobbyTimerConfirm.removeClass('hidden');
				this.ui.lobbyTimerLoading.addClass('hidden');
			}.bind(this);

			this.model.setLobbyTimer(lobbyTimerTimestamp, {
				wait: true,
				// The same lobby timer can be successfully set, which would not
				// trigger a change event, so the state needs to be restored
				// instead of relying on the view to be rendered again.
				success: function() {
					restoreState();
					OC.hideMenus();
					this.ui.roomModerationButton.focus();
				}.bind(this),
				error: function() {
					restoreState();

					OC.Notification.show(t('spreed', 'Error occurred while setting the lobby start time'), {type: 'error'});
				}.bind(this)
			});
		},

		/**
		 * Clipboard
		 */
		initClipboard: function() {
			if (this._clipboard) {
				this._clipboard.destroy();
				delete this._clipboard;
			}

			if (this.ui.clipboardButton.length === 0) {
				return;
			}

			this._clipboard = new Clipboard(this.ui.clipboardButton[0]);
			this._clipboard.on('success', function(e) {
				var $input = $(e.trigger);
				$input.tooltip('hide')
					.attr('data-original-title', t('core', 'Link copied!'))
					.tooltip('_fixTitle')
					.tooltip({placement: 'bottom', trigger: 'manual'})
					.tooltip('show');
				_.delay(function() {
					$input.tooltip('hide');
				}, 3000);
			});
			this._clipboard.on('error', function (e) {
				var $input = $(e.trigger);
				var actionMsg = '';
				if (/iPhone|iPad/i.test(navigator.userAgent)) {
					actionMsg = t('core', 'Not supported!');
				} else if (/Mac/i.test(navigator.userAgent)) {
					actionMsg = t('core', 'Press ⌘-C to copy.');
				} else {
					actionMsg = t('core', 'Press Ctrl-C to copy.');
				}

				$input.tooltip('hide')
					.attr('data-original-title', actionMsg)
					.tooltip('_fixTitle')
					.tooltip({placement: 'bottom', trigger: 'manual'})
					.tooltip('show');
				_.delay(function () {
					$input.tooltip('hide');
				}, 3000);
			});
		}
	});

	OCA.SpreedMe.Views.CallInfoView = CallInfoView;

})(OC, OCA, Marionette, $, _);
