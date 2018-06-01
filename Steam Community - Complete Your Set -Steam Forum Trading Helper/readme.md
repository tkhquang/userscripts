# Complete Your Set - Steam Forum Trading Helper

![Imgur](https://i.imgur.com/3OVdN7C.png)

![Imgur](https://i.imgur.com/vvai5fT.png)

[Gifv](https://i.imgur.com/p0KjMiD.gifv)

## INTRODUCTION

This was a small script I had made for myself to easily make new trade threads, or to compare which cards I own and which I don't with other existing threads. I've just edited it a little bit and decided to make it public. It is convenient and saves me a lot of time, so I think I may be useful for someone else too.

*Why did I make it?* Sometimes Steam Trade Matcher couldn't help me complete some game sets. I had to use the Trading Forum to find the cards I wanted. The original idea of this script was to list all the cards I've owned and have yet to own to complete a full set. Because when I navigate to the Trading Forum, I can't seem to remember which cards I'm looking for and which are the duplicated ones that I can trade them off. Having to switching between tabs is so inconvenient and tedious, so I made this script to list the Name and the #Number of the card in the Series to the input field of the New Trade Thread. Then I extended it a little bit to make the creating of new Trading Thread easier and also plus some small features.

Summer sale is coming near, I hope this will be useful for you to complete your remaining sets.

## FEATURES

1. Get Owned-Card-List and Unowned-Card-List
2. Can check the missing cards to complete the set
3. Automatically create and have it auto filled in the input areas in New Trading Thread arcoding to your config in the script

## DOWNLOAD

[Greasyfork.org](https://greasyfork.org/en/scripts/368518-steam-community-complete-your-set-steam-forum-trading-helper)

## INSTRUCTIONS

 1. Download and install Tampermonkey for your browser
 2. Download the script
 3. Press install when asked
 4. (Optional) Configure your preferred settings in the script code
 5. Go to the Game Card Page, if the script functions correctly then you will see a "Visit Trading Forum" button next to the "View cards in my Inventory" and "Sell these cards on the Market" within seconds. According to the default config, if you go to a Game Card Page that you don't have enough cards to have a full set, the button won't appear. However, if you open the browser console (Pressing F12 if you're on Firefox), on 'console' tab with 'logs' filtered, if you see this line: "Number of cards you've owned: x", then you can tell that the script is running correctly.
 6. Enjoy!

## FAQ

### Jesus Christ! The script somehow works, but the way you made it function is a disaster, seriously dude?

Yeah, I know, I'm not working in the IT field. I just know a little bit about Javascript (mostly self-learning) and that's all. I know there are probably better ways to do this stuff but it seems to work ok for me so I wanna share. I'd be happy if you can help me improve it. :)

### Uhm, it doesn't work for me, why is that?

I'm not sure, you can tell if the script is running by opening the browser console.

### It works, the console says so but why can't I notice anything different?

Open the script editor, uncomment those lines with `console.log` inside (Basically remove the `//` from `//console.log`). Go to the Game Card Page then grab some logs, then fire a [new issue](https://github.com/tkhquang/userscripts/issues/new) with those logs inside for me. I will see what I can do.
