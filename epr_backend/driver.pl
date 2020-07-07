use strict;
use warnings;
use feature qw/say/;

use LWP::UserAgent;
use JSON::PP;
use Data::Dump qw/dump/;

# Create a user agent object
my $ua = LWP::UserAgent->new;


# scenario: gets a new page render
#  user is 'john q public'
# we need to find the userid for rest of our schema to work
my $req = HTTP::Request->new(GET => 'http://localhost:3000/user?firstname=john&lastname=public');
my $res = $ua->request($req);
my $userid = decode_json($res->content)->{user_id};
if ($res->is_success) {
    say "John Public id is => $userid"; 
}
else { die "Lookup of John Public ID failed -> $!"; }

# display all of John Public's EPR data (including the subordinates)
$req = HTTP::Request->new(GET => "http://localhost:3000/getRecord?userid=$userid");
$req->content_type('application/json');
$req->content(encode_json({ userid => $userid}));
$res = $ua->request($req);
if ($res->is_success) {
    my $data = decode_json($res->content);
    say "John Public EPR data is => ";
    say "Rater Info " . dump($data->{raterInfo});
    say "Rated Airman: " . dump($data->{subordinates}->{data});
    say "Rated Airman: " . dump($data->{subordinates}->{reports});
}
else { die "Lookup of John Public EPR Data failed -> $!"; }

# add a new SrA under John Q Public 
$req = HTTP::Request->new(POST => "http://localhost:3000/addUser");
$req->content_type('application/json');
$req->content(encode_json({ 
    first_name => "Bruce",
    middle_initial => "A",
    last_name => "wayne",
    rank => "SrA",
    user_name => "publicjq",
    supervisor_id => $userid,
    epr_last_done => "04 Jan 2020",
    epr_next_due => "04 Jan 2021",
    aca_last_done => "06 Jul 2020",
    aca_next_due => "06 Jul 2021",
}));
$res = $ua->request($req);
my $newid = decode_json($res->content)->{user_id};
if ($res->is_success) {
    my $data = decode_json($res->content);
    say "New User ID is => $newid";
}
else { die "Add new user failed -> $!"; }

# AGAIN display all of John Public's EPR data (including the subordinates)
$req = HTTP::Request->new(GET => "http://localhost:3000/getRecord?userid=$userid");
$req->content_type('application/json');
$req->content(encode_json({ userid => $userid}));
$res = $ua->request($req);
if ($res->is_success) {
    my $data = decode_json($res->content);
    say "John Public EPR data is => ";
    say "Rater Info " . dump($data->{raterInfo});
    say "Rated Airman: " . dump($data->{subordinates}->{data});
    say "Rated Airman: " . dump($data->{subordinates}->{reports});
}
else { die "Lookup of John Public EPR Data failed -> $!"; }
