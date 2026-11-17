# Precentor: notes for App Review

Apple asked for more information under Guideline 2.1. Copy the text under "Text for App Review
Notes" into the field "Notes" of App Review Information in App Store Connect. The field has a limit
of 4000 characters. Put the link to the video in place of `[video link]`.

The section "Manual steps for the video" is for you. Do not paste it.

## Text for App Review Notes

1. Screen video

The video is on a physical iPhone. It starts at the launch of the app. It shows the usual use of the
app, from the start to the end. The app also runs on the iPad. On the iPad, the screens and the steps
are the same.

Video: [video link]

The app has no account, no login, no content from users and no purchases. So the video does not show
these items.

2. Purpose and audience

Precentor helps people sing the psalms of the 1650 Scottish Psalter, the Psalms of David in Metre.
Churches in the Presbyterian and Reformed tradition sing these psalms today.

The audience is members of these churches, their families, and the precentors who lead the psalms in a
service. Many of these people cannot read music. Many do not know the tunes.

The app shows the words of each psalm. It plays a tune in four parts and lights each syllable when
you must sing it. So a person can learn a psalm and its tune at home. The app works with no
connection, for example in a church with no signal.

The app is free. It has no advertisements. It does not track its users.

3. Instructions

No setup and no login are necessary. Do these steps:

1. Open the app. The home screen shows all 150 psalms and the second versions of 13 psalms.
2. Type a number or words in the search box, for example "23" or "shepherd".
3. Tap a psalm, for example Psalm 23.
4. Tap Play. The player plays the tune once through. Then it plays each verse.
5. To go to the words, tap "Skip to verse 1". Each syllable lights when you must sing it.
6. Tap Speed + or Speed − to change the speed. Tap Key + or Key − to change the key.
7. Tap the button "Tune" to choose another tune of the same metre.
8. Tap Music to see the music of the tune. The note that sounds is lit.
9. Tap the back button. On the home screen, tap About. The About page shows the sources of the
   words and the tunes. The link "Privacy" at the end of the page opens the privacy policy.

4. External services

The app uses no external service for its core functions. It has no server, no analytics, no
advertisements and no account. The psalms, the tunes and the music are in the app bundle. The app
makes the sound on the device. The app uses two libraries on the device. Both are open source:

- react-native-audio-api, which plays the sound.
- abcjs, which draws the music.

Some links open a web page in the browser of the app. These links are optional. They go to the
source of each tune, to the notes of John Brown of Haddington on each psalm, and to Hearers. The
developer of Precentor also makes Hearers and haddingtonbible.org. If the app of such a site is on
the iPhone, the link opens that app.

5. Regions

The app works the same in all regions. It has no content and no function that changes with the
region. The app is in English.

6. Third-party material

All of the text, the tunes and the data in the app are in the public domain or have an open licence.
The About page of the app gives this information too.

- The words: the Scottish Psalter of 1650. The text is in the public domain. The app gets it from
  Open 1650, a project by Kaden Cartwright (github.com/kadencartwright/open-1650). Open 1650 marks
  the text with the Public Domain Mark 1.0.
- The tunes and their harmonies: public domain. Most are from 1562 to 1872. The app shows the
  composer and the source of each tune. Most sources are the Christian Classics Ethereal Hymnary
  (ccel.org). The harmony of Auld Lang Syne is by Philip Rice (2015). The Choral Public Domain
  Library (cpdl.org) gives this harmony as public domain.
- The match of each syllable to its note: from Open 1650, under CC0 1.0.
- The code of the player: from Open 1650, under the MIT License.
- The font Inter: under the SIL Open Font License 1.1.
- The app uses no recorded sound. The device makes each note.

## Manual steps for the video

If the Maestro flow `.maestro/review-demo.yaml` does not work on the iPhone, use these steps. So
that a reviewer can see each screen, do each step slowly.

1. On the Mac, open QuickTime Player. Click File, then New Movie Recording.
2. Select the iPhone as the camera and as the microphone. Turn up the volume of the iPhone.
3. Close Precentor on the iPhone. Show the home screen of the iPhone.
4. In QuickTime, click the red button. The video starts.
5. Tap the icon of Precentor. Wait 3 seconds on the list of psalms.
6. Scroll down the list. Then scroll back to the top.
7. Tap the search box. Type "shepherd". Tap the heading to close the keyboard.
8. Tap Psalm 23. If the Music view shows, tap Words.
9. Tap Play. After 4 seconds, tap "Skip to verse 1".
10. Let verse 1 play for 10 seconds. Then tap Pause.
11. Tap Speed +, then Speed −. Tap Key +, then Key −.
12. Tap the button "Tune". Tap "Dundee (French)".
13. Tap Play. After 6 seconds, tap Pause.
14. Tap Music. Wait for the music. Tap Play. After 6 seconds, tap Pause.
15. Tap Words. Tap the button "Tune". Tap "Crimond · recommended".
16. Tap the back button. Tap the search box and delete the text.
17. Tap About. Scroll down to "The words and the tunes". Wait 4 seconds.
18. Scroll to the end of the page. Tap Privacy. Wait 4 seconds.
19. Tap the back button two times. Wait 3 seconds on the home screen.
20. In QuickTime, click the stop button. The video stops.
