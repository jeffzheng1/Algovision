Running Algovision
==========

<ol> 
<li>Start the Google Go server located in the folder <em>server</em> with the command <pre><code>go run runtime_server.go</code></pre></li>
<li>Start your preferred webhosting client at socket 9090. For example:
<pre><code>python -m SimpleHTTPServer 9090</code></pre>
</ol>
<b>Dependencies: </b>This application requires the installation of the Google Go language. <br>
<b>Disclaimer:</b> The Wolfram Alpha API takes a while to respond to a query and sometimes may timeout. Please be patient.

AlgoVision Design Doc
===========
<b>Authors:</b> <br>
Jeff Zheng (cs164-bd), Pierce McEntagart (cs164-bp), Serena Chan (cs164-bc) <br>
<b>Original Project Proposal: </b> https://docs.google.com/document/d/1RVBn2zufNfCLN4fz1GJg1myS4YQebRHvjKBC60JzZ7Y/edit <br>
<b>Video Demo: </b> <br>
https://www.youtube.com/watch?v=--89RYkMaCA&feature=youtu.be

The Problem
===========
Visualizing the tree structure of an algorithm’s execution tells a lot about its behavior. This can be done on paper, but it is tedious. By building visualization right into the cs164 language, we can make it available with a very small API and minimal changes to the interpreter, allowing us to focus on visualization rather than hacking an interpreter. Furthermore, performing efficiency analysis on a call-tree makes more sense in the context of a language.

Related Work
===========
Visualizers aren’t uncommon. One notable example is Online Python Tutor. You can input valid Python code and OPT will visualize its execution for you. The format of the visualization is a call stack, which is slightly different than what we are trying to do, which is to show the tree structure of an algorithm. One thing we like about OPT is that it shows the local bindings of each call frame on the stack, so we will incorporate that into our design.
WolframAlpha has a powerful recurrence tool. You can simply type in a recurrence relation, and it will solve it for you. We may use this to help us analyze the run-time efficiency of the algorithm we visualize a call tree for. One limitation of WolframAlpha’s recurrence tool is the input format is pretty restrictive. We would have to keep track of how the input shrinks on each recursive call of a visualized algorithm and format it into a human-readable equation in order to submit it to WolframAlpha.

Solution
===========
Our solution to the problems above are simple. Make a few changes to the cs164 interpreter and add a couple keywords, draw a tree, and analyze the run-time of the tree we draw. Each has a few components though.
####Make a few changes to the cs164 interpreter and add a couple keywords:
We will need to add a ‘draw’ keyword which accepts a function.
We add the function name to a list of ‘drawable’ functions maintained by the interpreter. Any time a ‘drawable’ function is called, we modify its bytecode to include a ‘draw’ field set to True, and we do the same for any other calls made within the call frame. This means we draw a node for every function call made by another function, but sub-trees will only be drawn for recursive calls.
####Draw a tree:
We have a lot of options for visualization, but the running idea is to use a
simple k-ary (for k calls made a single call frame) to represent the algorithm.
If the ‘draw’ field is set for a call, we will update a JS representation of the tree,
which will be fed to d3.js code once the execution of the algorithm is complete.
This is easier than drawing the tree as we execute because it gives us access
to a data structure that we might need for other things down the line, like 
run-time analysis.
####Analyze the run-time:
Once we have a JS representation of a call-tree, we will have to format it
to a human-readable equation if we choose to leverage WolframAlpha’s 
recurrence calculator. Otherwise, we will examine the size of the inputs and
the structure of the tree to provide a decision on the run-time.


Relevance to 164
===========
This is relevant to 164 in a few ways. First off, we are adding keywords and adding an AST node. Second, run-time analysis varies by language, so it is pertinent to embed the visualizer in a language. We chose 164 because it wouldn’t be feasible for us to hack anything bigger in the amount of time we have. Third, leveraging multiple languages at once (d3 and cs164) displays a language’s ability to be a building block for other tools, so we show that both 164 and d3 are useful in that regard.

####Three examples to achieve trees and run-times:
<ol>
<li>Recursive fibonacci (easy)</li>
<li>Merge sort (medium)</li>
<li>Iterative fibonacci (hard)</li>
</ol>

Design & Implementation Plan
===========
We described most of our design and implementation plan in the solutions portion of this design doc, but to reiterate, we will add to our 164 interpreter, provide a visualization of the call tree, and analyze either the tree or program code to determine the run-time.
####Changing the cs164 interpreter:
Our implementation plan of how to change the 164 interpreter is described up above in our solutions and more so in the following subsection.
####Visualization of the call tree:
In order to get a visualization of the call tree, we will be adding to the interpreter. Whenever there is a “draw” type, each new stack frame produced from the lambda call will be pushed into a new data structure. This data structure will store all the call frames produced from the execution of the lambda function that we are hoping to draw. D3 will then visualize each call stack from this data structure as a node in a tree.
####Run-time Analysis:
We have two methods of determining the run-time of a program. If it is recursive, we will have to parse the program to get the base case(s) and recursive case and use those as the input in our call to the WolframAlpha API. If the program is not recursive, we will still have to parse the program and determine the run-time manually by looking for loops, calls to other functions, etc. 
####Drawing:
https://docs.google.com/a/berkeley.edu/drawings/d/1VKZnosXOITm7SQCmsrRJSeTP3MGl_5JhEdi_8F6khvU/edit?usp=sharing

Steps
===========
<ol>
<li>Add the “draw” keyword to the grammar of 164 and change the cs164 interpreter accordingly<br>
<b>Upon completion:</b> complete functionality of calls to draw in interpreter (but no resulting visualization)</li>
<li>Take the data structure containing all stack frames of the lambda calls (from the function we wish to draw) and utilize D3 to draw them as nodes in a tree<br>
<b>Upon completion:</b> accurate visualization of tree</li>
<li>Determine a way of parsing recursive programs to extract the base case(s) and recursive case to use as inputs in our call to the WolframAlpha API<br>
<b>Upon completion:</b> getting the run-time of recursive functions</li>
<li>Determine a way of parsing iterative programs and establishing a set of guidelines based off parameters/loops/callbacks that will differentiate between constant/linear/log/etc. run-time <br>
<b>Upon completion:</b> getting the run-time of all programs</li>
</ol>
