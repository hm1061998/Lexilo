interface AppErrorOptions {
  cause?: unknown;
}

export class AppError extends Error {
  readonly cause?: unknown;

  constructor(message: string, options?: AppErrorOptions) {
    super(message);
    this.name = new.target.name;
    this.cause = options?.cause;
  }
}

export class DatabaseError extends AppError {}
export class ValidationError extends AppError {}
export class ImportError extends AppError {}
export class SyncError extends AppError {}
export class NetworkError extends AppError {}
export class DeckNotFoundError extends AppError {}
export class CardNotFoundError extends AppError {}
export class DuplicateCardError extends AppError {}
export class InvalidImportFileError extends AppError {}
export class ImportLimitExceededError extends AppError {}
export class TagAlreadyExistsError extends AppError {}
export class StudySessionNotFoundError extends AppError {}
export class ActiveStudySessionExistsError extends AppError {}
export class StudySessionAlreadyCompletedError extends AppError {}
export class InvalidStudySessionTransitionError extends AppError {}
export class StudyItemNotFoundError extends AppError {}
export class StudyItemAlreadyAnsweredError extends AppError {}
export class NoStudyCardsAvailableError extends AppError {}
export class NotEnoughMultipleChoiceOptionsError extends AppError {}
export class InvalidReviewRatingError extends AppError {}
export class CardProgressNotFoundError extends AppError {}
export class StatisticsUnavailableError extends AppError {}
export class InvalidStatisticsRangeError extends AppError {}
export class LearningGoalsNotFoundError extends AppError {}
export class InvalidLearningGoalError extends AppError {}
export class StatisticsRebuildError extends AppError {}
export class InvalidDateRangeError extends AppError {}
export class NotificationPermissionDeniedError extends AppError {}
export class NotificationSchedulingError extends AppError {}
export class MediaFileNotFoundError extends AppError {}
export class UnsupportedMediaTypeError extends AppError {}
export class MediaFileTooLargeError extends AppError {}
export class AudioPlaybackError extends AppError {}
export class AudioRecordingError extends AppError {}
export class BackupCreationError extends AppError {}
export class InvalidBackupError extends AppError {}
export class UnsupportedBackupVersionError extends AppError {}
export class RestoreFailedError extends AppError {}
export class DatabaseIntegrityError extends AppError {}
export class SyncAlreadyRunningError extends AppError {}
export class SyncNetworkUnavailableError extends AppError {}
export class SyncConflictDetectedError extends AppError {}
export class SyncPermanentFailureError extends AppError {}
