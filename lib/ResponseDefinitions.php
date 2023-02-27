<?php
declare(strict_types=1);

/**
 * @copyright Copyright (c) 2023 Kate Döen <kate.doeen@nextcloud.com>
 *
 * @author Kate Döen <kate.doeen@nextcloud.com>
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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Talk;

/**
 * @psalm-type SpreedCommand = array{
 *     id: int,
 *     app: string,
 *     name: string,
 *     command: string,
 *     script: string,
 *     response: int,
 *     enabled: int,
 * }
 *
 * @psalm-type SpreedRoomShare = array{
 *     id: int,
 *     room_id: int,
 *     user_id: string,
 *     access_token: string,
 *     remote_id: string,
 *     remote_token: ?string,
 *     remote_server: ?string,
 * }
 *
 * @psalm-type SpreedReaction = array{
 *     actorType: string,
 *     actorId: string,
 *     actorDisplayName: string,
 *     timestamp: int,
 * }
 *
 * @psalm-type SpreedPollVote = array{
 *     actorType: string,
 *     actorId: string,
 *     actorDisplayName: string,
 *     optionId: int,
 * }
 *
 * @psalm-type SpreedPoll = array{
 *     id: int,
 *     question: string,
 *     options: string[],
 *     votes: array<string, int>,
 *     numVoters: int,
 *     actorType: string,
 *     actorId: string,
 *     actorDisplayName: string,
 *     status: int,
 *     resultMode: int,
 *     maxVotes: int,
 *     details: ?SpreedPollVote[],
 *     votedSelf: int[],
 * }
 *
 * @psalm-type SpreedMessageParameter = array{
 *     type: string,
 *     id: string,
 *     name: string,
 *     call-type: ?string,
 * }
 *
 * @psalm-type SpreedMessage = array{
 *     id: int,
 *     token: string,
 *     actorType: string,
 *     actorId: string,
 *     actorDisplayName: string,
 *     timestamp: int,
 *     message: string,
 *     messageParameters: array<string, SpreedMessageParameter>,
 *     systemMessage: string,
 *     messageType: string,
 *     isReplyable: bool,
 *     referenceId: string,
 *     reactions: array<string, integer>,
 *     expirationTimestamp: int,
 *     deleted: ?bool,
 * }
 *
 * @psalm-type SpreedRoom = array{
 *     id: int,
 *     token: string,
 *     type: int,
 *     name: string,
 *     displayName: string,
 *     objectType: string,
 *     objectId: string,
 *     participantType: int,
 *     participantFlags: int,
 *     readOnly: int,
 *     hasPassword: bool,
 *     hasCall: bool,
 *     callStartTime: int,
 *     callRecording: int,
 *     canStartCall: bool,
 *     lastActivity: int,
 *     lastReadMessage: int,
 *     unreadMessages: int,
 *     unreadMention: bool,
 *     unreadMentionDirect: bool,
 *     isFavorite: bool,
 *     canLeaveConversation: bool,
 *     canDeleteConversation: bool,
 *     notificationLevel: int,
 *     notificationCalls: int,
 *     lobbyState: int,
 *     lobbyTimer: int,
 *     lastPing: int,
 *     sessionId: string,
 *     lastMessage: ?SpreedMessage,
 *     sipEnabled: int,
 *     actorType: string,
 *     actorId: string,
 *     attendeeId: int,
 *     permissions: int,
 *     attendeePermissions: int,
 *     callPermissions: int,
 *     defaultPermissions: int,
 *     canEnableSIP: bool,
 *     attendeePin: string,
 *     description: string,
 *     lastCommonReadMessage: int,
 *     listable: int,
 *     callFlag: int,
 *     messageExpiration: int,
 *     avatarVersion: string,
 *     breakoutRoomMode: int,
 *     breakoutRoomStatus: int,
 * }
 *
 * @psalm-type SpreedRoomParticipant = array{
 *     roomToken: string,
 *     inCall: int,
 *     lastPing: int,
 *     sessionIds: string[],
 *     participantType: int,
 *     attendeeId: int,
 *     actorId: string,
 *     actorType: string,
 *     displayName: string,
 *     permissions: int,
 *     attendeePermissions: int,
 *     attendeePin: string,
 *     status: ?string,
 *     statusIcon: ?string,
 *     statusMessage: ?string,
 *     statusClearAt: ?int,
 * }
 *
 * @psalm-type SpreedCallPeer = array{
 *     actorType: string,
 *     actorId: string,
 *     displayName: string,
 *     token: string,
 *     lastPing: int,
 *     sessionId: string,
 * }
 *
 * @psalm-type SpreedMention = array{
 *     id: string,
 *     label: string,
 *     source: string,
 *     status: ?string,
 *     statusIcon: ?string,
 *     statusMessage: ?string,
 *     statusClearAt: ?int,
 * }
 *
 * @psalm-type SpreedMatterbridge = array{
 *     enabled: bool,
 *     pid: int,
 *     parts: array,
 * }
 *
 * @psalm-type SpreedMatterbridgeProcessState = array{
 *     running: bool,
 *     log: string,
 * }
 *
 * @psalm-type SpreedSignalingSettings = array{
 *     signalingMode: string,
 *     userId: string,
 *     hideWarning: bool,
 *     server: string,
 *     ticket: string,
 *     helloAuthParams: array{
 *         "1.0": array{
 *             userid: string,
 *             ticket: string,
 *         },
 *         "2.0": array{
 *             token: string,
 *         },
 *     },
 *     stunservers: array{urls: string[]}[],
 *     turnservers: array{urls: string[], username: string, credential: string},
 *     sipDialinInfo: string,
 * }
 *
 * @psalm-type SpreedSignalingUsers = array{
 *     userId: string,
 *     roomId: int,
 *     lastPing: int,
 *     sessionId: string,
 *     inCall: int,
 *     participantPermissions: int,
 * }
 */
class ResponseDefinitions {
}
