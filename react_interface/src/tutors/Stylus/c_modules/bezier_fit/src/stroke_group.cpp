#include <stdio.h>
#include <stdlib.h>
#include <algorithm>
#include <list>
#include "GraphicsGems.h"
#include <math.h>

// using namespace std::algorithm; 


extern "C" {
	int c_GroupStrokes(double *d,int *lens, int n_strokes,int *output,
		double inflate, double squareFactor, double minHW);
	int c_GroupBounds(void *b, int n, int *output);
}

struct Bound
{
    int id;
    double minX;
    double maxX;
    double minY;
    double maxY;
};

struct AxisElm
{
	Bound *bound;
	double val;
	AxisElm* other;
	bool isMin;
	std::list<int> *group;
	// std::list<Bound *> lstElm;


};

bool axisElmComp (AxisElm *a,AxisElm *b) { return ((*a).val<(*b).val); }






int c_GroupBounds(void *b, int n, int *output){
	Bound *bounds = (Bound *)b;

	AxisElm *xs = (AxisElm *)malloc(2 * sizeof(AxisElm) * n);
	AxisElm **sorted_xs = (AxisElm **)malloc(2 * sizeof(AxisElm *) * n);
	// AxisElm *ys = (AxisElm *)malloc(2 * sizeof(AxisElm) * n);

	std::list<std::list<int>> groups = {}; 
	std::list<int> empty = {};
	for (int i = 0; i < n; i++) { 
		// Bound b = bounds[i];
		// printf("%f, %f\n", b.minX, b.maxX);
		AxisElm x_min = {&bounds[i], bounds[i].minX, &xs[i*2 + 1], true, &empty};
		AxisElm x_max = {&bounds[i], bounds[i].maxX, &xs[i*2],   false,  &empty};
		// AxisElm y_min = {&b, b.minY};
		// AxisElm y_max = {&b, b.maxY};
        xs[i*2] = x_min;
        xs[i*2 + 1] = x_max;
        sorted_xs[i*2] = &xs[i*2];
        sorted_xs[i*2 + 1] = &xs[i*2 + 1];
        // ys[i*2] = y_min;
        // ys[i*2 + 1] = y_max;
    } 
    // printf("%s\n", );
    std::sort(sorted_xs, sorted_xs + (n*2), axisElmComp);

    std::list<AxisElm *> workingSet = {};
    for (int i = 0; i < n*2; i++) {
    	Bound b = *(*sorted_xs[i]).bound;
    	// printf("%i, %f %f\n", b.id, b.minX, xs[i].val);

    	if((*sorted_xs[i]).isMin){
    		
    		AxisElm *ae2 = sorted_xs[i];//workingSet.back();//(*it2);
    		for (std::list<AxisElm *>::iterator it1=workingSet.begin(); it1!=workingSet.end(); ++it1){
	    		AxisElm *ae1 = (*it1);
	    		// printf("%i ", ae1.bound->id);
	    		
	    		// std::list<int> group = 
	    		// std::list<AxisElm *>::iterator it2 = workingSet.end();
	    		// for (std::list<AxisElm *>::iterator it2=std::next(it1,1); it2!=workingSet.end(); ++it2){
    			
    			// printf("PAIR: %i %i\n",ae1->bound->id,ae2->bound->id );
    			if(ae1->bound->minY <= ae2->bound->maxY && ae1->bound->maxY >= ae2->bound->minY){
    				ae1->group->push_back(ae2->bound->id);
    				ae2->group = ae1->group;
    				break;		
    				// printf("Intersect %i %i \n", ae1->bound->id,ae2->bound->id);	
    			}
    			// printf("PAIR %i %i \n", ae1->bound->id,ae2->bound->id);	
// 
    		// }
    		// printf("%i ", (**it).bound->id);
    		
    		}
    		if(ae2->group->empty()){
    			std::list<int> group2 = {ae2->bound->id};
    			groups.push_back(group2);
    			ae2->group = &groups.back();
    		}
    		workingSet.push_back(ae2);

    	}else{

    		//TODO can make better
    		workingSet.remove((*sorted_xs[i]).other);
    		// printf("ERASE: %i %i\n", (*(*sorted_xs[i]).other).bound->id,(*sorted_xs[i]).bound->id );
    	} 

    	

    	

    	// printf("]\n ");

    	
    }
    int *out_i = output;
    int nGroups = 0;
    for (std::list<std::list<int>>::iterator it1=groups.begin(); it1!=groups.end(); ++it1){
		std::list<int> group = *it1;
		// printf("[ ");
		int L = 0;
		int *out_j = out_i + 1;
		for (std::list<int>::iterator it2=group.begin(); it2!=group.end(); ++it2){
			// printf("%i ", *it2);
			out_j[L] = *it2;
			L++;
		}
		out_i[0] = L;
		out_i += (L+1);
		nGroups++;
		// printf("]\n" );
		// printf("%i \n", L);
	}

	free((void *) xs);
	free((void *) sorted_xs);
	return nGroups;
 	// free((void *)xs);
 	// free((void *)sorted_xs);
    // free((void *)ys);   
}



Bound GetBounds(double *d,int n,double inflate,double squareFactor,double minWH){
	Point2 *points = (Point2 *)d;
	Bound b;
	// Bound *bounds = (Bound *)malloc(sizeof(Bound) * n);
	b.minX = points[0].x;
	b.maxX = points[0].x;
	b.minY = points[0].y;
	b.maxY = points[0].y;
	for (int i = 1; i < n; i++) { 
		Point2 p = points[i];
		if(p.x < b.minX){b.minX = p.x;}
		if(p.x > b.maxX){b.maxX = p.x;}
		if(p.y < b.minY){b.minY = p.y;}
		if(p.y > b.maxY){b.maxY = p.y;}
	}
	if(inflate > 0.0 || squareFactor > 0.0){
		double width = b.maxX-b.minX;
		double height =b.maxY-b.minY;
		width  = fmax(fmax(width * (1.0+inflate), height * squareFactor), minWH);
		height = fmax(fmax(height * (1.0+inflate), width * squareFactor), minWH);
		double midX = (b.maxX+b.minX)/2;
		double midY = (b.maxY+b.minY)/2;
		b.minX = midX - width/2;
		b.maxX = midX + width/2;
		b.minY = midY - height/2;
		b.maxY = midY + height/2;
	}
	return b;
}

Bound GetBounds(double *d, int n){
	return GetBounds(d, n, 0.0, 0.0, 5.0);
}

int c_GroupStrokes(double *d,int *lens, int n_strokes,int *output,double inflate, double squareFactor, double minWH){
	int *cumLens = (int *)malloc(sizeof(int) * (n_strokes+1) );
	int c = 0;
	for (int i = 0; i < n_strokes; i++) { 
		cumLens[i] = c;
		c += lens[i];
	}
	cumLens[n_strokes] = c;

	Point2 *points = (Point2 *)d;
	Bound *bounds = (Bound *)malloc(sizeof(Bound) * (n_strokes) );
	for (int i = 0; i < n_strokes; i++) { 
		int prev;
		Bound b = GetBounds((double *)&points[cumLens[i]], cumLens[i+1]-cumLens[i], inflate, squareFactor, minWH);
		b.id = i;
		bounds[i] = b;
		// printf("%i %f %f %f %f\n", b.id,b.minX,b.maxX,b.minY,b.maxY);
	}

	int nGroups = c_GroupBounds(bounds,n_strokes,output);

	free((void *) cumLens);
	free((void *) bounds);

	return nGroups;
	
}

void printGroups(int *groups, int nGroups){
	int *g_i = groups;
	for (int i = 0; i < nGroups; i++) { 
		// printf("LEN: %i %i",g_i[0],(long int)g_i);
		printf("[ ");
		for (int j = 1; j < g_i[0]+1; j++) { 
			printf("%i ", g_i[j]);
		}
		printf("]\n");
		g_i += g_i[0]+1;
	}
}

#if 0
int main(){
	int nGroups;
	static Bound d[] = {
		{ 0, 300,400,300,400 },
		{ 1, 100,150,100,150 },
		{ 2, 150,200,150,200 },
		{ 3, 125,175,125,175 },
		{ 4, 0  ,50 ,0  ,50 },
		{ 5, 25 ,50 ,25 ,50 },		
	};

	int* output = (int *) malloc(sizeof(int) * 2 * (sizeof(d) / sizeof(d[0])));
	nGroups = c_GroupBounds(&d,sizeof(d) / sizeof(d[0]),output);
	printGroups(output,nGroups);

	static Point2 p[] = {
		{ 300,400 },
		{ 400,300 },
		{ 100,150 },
		{ 150,100 },
		{ 200,150 },
		{ 150,200 },
		{ 175,125 },
		{ 125,175 },
		{ 0  ,50  },
		{ 50 ,0   },
		{ 25 ,50  },
		{ 50 ,25  },
		{ 80 ,220  },
		{ 220 ,80  },		
	};
	const int L = sizeof(p) / (sizeof(p[0]) *2);
	static int lens[L];
	std::fill_n(lens,L,2);

	nGroups = c_GroupStrokes((double *)p,lens,L,output);
	printGroups(output,nGroups);
	return 0;
}
#endif