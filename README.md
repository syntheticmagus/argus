# Argus

Argus is a Web app for creating and monitoring *ad-hoc* camera clusters for 
remote site observation. It provides a way for independent devices to 
function in much the same way as a traditional CCTV system, but without
requiring any fixed infrastructure. The use case informing development is
construction, focusing on scenarios where an off-site expert may wish to
remotely observe activity in a dynamic environment ill-suited to static 
remote monitoring fixtures.

**Like any other camera technology, please only use Argus where usage is 
permissible and appropriate.**

## Quick Start Guide

There are two roles for devices using Argus: Sensors and Viewers. Sensors 
provide data, such as live camera feed, to remote Viewers. A typical Argus 
use case may involve many Sensors remaining live for extended periods, 
during which small numbers of Viewers may enter and exit the experience
at will.

### To Add a Sensor to a Site

1.  On the Sensor device, go to https://syntheticmagus.github.io/argus/. Use
    only the forms in the "Sensor" section for steps 2 thorugh 5.
1.  In the "Site" field, enter a name for your site. **Try to choose a unique
    name as this name is how Viewers will find your Sensors.** See
    [Security Considerations](#security-considerations) for more information
    on why this might matter.
1.  In the "Name" field, enter a name for **this Sensor**. This name should
    be unique within your site.
1.  In the "Password" field, enter a password for this **site**. All Sensors
    on the same site should have the same password.
1.  Press the "Submit" button.
1.  The page will load the Sensor experience. The device is now functioning
    as an Argus Sensor; it can be placed anywhere and, as long as it has 
    network connectivity, it will make its Sensor data available to Argus
    Viewers with the appropriate login information.

### To Add a Viewer to a Site

1.  On the Viewer device, go to https://syntheticmagus.github.io/argus/. Use
    only the forms in the "Viewer" section for steps 2 thorugh 4.
1.  In the "Site" field, enter the name of your site.
1.  In the "Password" field, enter the password for your site.
1.  Press the "Submit" button.
1.  The page will load the Viewer experience. The device is now functioning
    as an Argus Viewer and will allow the observation of all Sensor data
    associated with the provided site name and password.

## How It Works

Argus is built on [WebRTC](https://webrtc.org/), a standard Web technology
which simplifies the creation of secure peer-to-peer connections for 
purposes like video chat. Argus uses this technology to allow Viewers to
connect to Sensors directly and individually, removing the need for 
large centralized infrastructure. The only infrastructure Argus has is an
extremely lightweight registry live service which keeps lists of all the
Sensor IDs in all the sites. This registry allows Viewers to identify
the relevant site Sensors so that they can be contacted individually using
WebRTC; each Sensor will then individually verify that the Viewer has 
the correct password before it provides Sensor data. Neither passwords
nor Sensor data are ever sent to a live service; that data is exclusively
handled by the Sensor, the Viewer, and the WebRTC connection between them.

## Security Considerations

Good site names and passwords are key to using Argus securely and
effectively. Argus's design specifies that every Sensor is independently 
responsible for its own security and will never provide Sensor data to a 
Viewer unless that Viewer provides the correct password. With good site
name and password choice, this means that no Viewer will ever see Sensor
data from another person's site. However, as an example, consider what 
might happen if a careless user chooses a common site name such as, 
"my site." Every time the user adds a Sensor to "my site," the Argus
registry service will add that Sensor to the list of Sensors active on
"my site." If another user has also chosen to refer to her site as
"my site," the Sensors of both users will be added to the *same list* in
the Argus registry. Then, when either of these users attempts to view
"my site," the resulting Viewer will ask the registry for a list of 
Sensors on "my site" and will receive a list of *both user's Sensors.*
This, by itself, is not ideal but not disasterous, for the individual
Sensors cannot be accessed without the correct password. Assuming the
users have chosen different passwords, the Viewers will waste some effort
contacting the other user's Sensors, but those Sensors will reject the
connection request for having the wrong password and the users will
only actually connect to their own Sensors. However, if the users both
chose to use the same common password as well -- for example, 
"password" -- then Argus recognizes no distinction between these sites
and the Sensors for both sites will provide data to Viewers from both
users because, from the Sensor's perspective, the user provided the 
correct password.

**In short, because Argus does not a have a concept of a "user," 
information is organized exclusively by site name and access is gated
exclusively by password. For this reason, choosing a unique site name
is important, and choosing a good and unique password is absolutely
essential.** This is really just common-sense networked computing 
security, but like most common sense, it bears repeating.

### Choosing a Unique Site Name
Site names do not need to be 
fancy, but they should be easy for you to remember and unlikely for 
someone else to accidentally overlap with. Including your name, your 
company's name, site location information, and/or site description 
may help with this. For example, if Alice Bobsworth is overseeing a 
construction job on Charlie Road, "alice bobsworth charlie road 
construction" could be a good name for her site.

### Choosing a Great Password
There is 
[a wealth of information](https://us.norton.com/internetsecurity-how-to-how-to-choose-a-secure-password.html)
available about how to choose a strong password, 
[some of which is even accurate](https://xkcd.com/936/).
While it is strongly recommended to do your own research, the 
overabundance of conflicting advice about passwords can be 
confusing. Again, please do your own research and come to your
own conlusions, but if it's helpful, I can tell you how I think
of the issue.

In general, I think of a good password as havnig two 
characteristics:

1.  **It should be long.** This is by far the most important
    characteristic, and one many people balk at because they
    don't like typing, but I assure you it's worth it. Password
    length hurts cyber attackers far more than it hurts you; if 
    it takes you another half second to type, it might take them 
    another half *decade* to crack.
1.  **It should contain some garbage.** Specifically, it should
    have at least one piece that isn't just an ordinary word, or
    something closely related to a word, as passwords made up
    entirely of real words 
    [can be attacked using special techniques](https://en.wikipedia.org/wiki/Dictionary_attack).
    Note that the *whole password* doesn't need to be garbage;
    it just needs some garbage *in* it.

With those two characteristics in mind, the following are 
examples of passwords of varying quality.

*   **"salad" is the worst kind of password.**
*   **"floofle" is a terrible password.** Also, contrary to 
    popular myth, "fl00f1e," "Flo0fL3," and "b4.17$t" are all
    *almost exactly as terrible* as "floofle."
*   **"behold on high the salad gods" is a pretty good 
    password.**
*   **"behold on high the floofle salad gods" is a great
    password.**
