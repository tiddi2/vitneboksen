namespace Shared
{
    public static class Constants
    {
        public const string ConcatinatedVideoFileName = "concatenated.mp4";
        public const string SessionInfoFileName = "session.json";
        public const string IntroFileName = "intro.mp4";
        public const string TransitionFileName = "transition.mp4";
        public const string ResourceContainer = "intro";
        public const string UnprocessedContainer = "unprocessed";

        public static class VideoTypes
        {
            public static string ActionShot = nameof(ActionShot);
            public static string Testimonial = nameof(Testimonial);
        }
    }

}